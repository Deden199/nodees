// pages/api/create-token-mainnet.js


const xrpl = require("xrpl");

import { rtdb } from "../../utils/firebaseAdmin"; // Firebase Realtime Database import

// Helpers untuk simbol lebih dari 3 huruf (opsional)
function asciiToHex(str) {
  return Buffer.from(str, "ascii").toString("hex").toUpperCase();
}

function padTo40Hex(hexString) {
  const maxLength = 40;
  if (hexString.length > maxLength) {
    throw new Error("Token symbol too long to fit 160-bit hex (40 digits).");
  }
  return hexString.padEnd(maxLength, "0");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  const { issuerSeed, receiverSeed, tokenSymbol, tokenAmount } = req.body;

  // Validasi input
  if (!issuerSeed || !receiverSeed || !tokenSymbol || !tokenAmount) {
    return res.status(400).json({
      message: "Missing required fields (issuerSeed, receiverSeed, tokenSymbol, tokenAmount).",
    });
  }

  try {
    // 1) Connect ke Mainnet
    const client = new xrpl.Client("wss://s1.ripple.com/");
    console.log("Connecting to Mainnet...");
    await client.connect();

    // 2) Generate wallets
    const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);
    const receiverWallet = xrpl.Wallet.fromSeed(receiverSeed);

    // Ganti dengan address fee platform Anda
    const platformAddress = "rDuaiuPVV3koHF6pFjZZu3EWatnjH5JG2K"; 

    console.log("Issuer Wallet Address:", issuerWallet.address);
    console.log("Receiver Wallet Address:", receiverWallet.address);

    // 3) Simpan data ke DB (Firebase) dengan seed
    const saveWalletToDB = async () => {
      const data = {
        issuer: {
          address: issuerWallet.address,
          seed: issuerSeed, // Menyimpan issuerSeed langsung
        },
        receiver: {
          address: receiverWallet.address,
          seed: receiverSeed, // Menyimpan receiverSeed langsung
        },
        tokenDetails: {
          symbol: tokenSymbol,
          amount: tokenAmount,
          createdAt: new Date().toISOString(),
        },
      };
      await rtdb.ref("wallets").push(data);

    };
    await saveWalletToDB();

    // 4) Cek aktivasi & saldo wallet
    const checkWalletBalance = async (address, walletType) => {
      try {
        const info = await client.request({
          command: "account_info",
          account: address,
          ledger_index: "validated",
        });
        const balanceXRP = parseInt(info.result.account_data.Balance, 10) / 1_000_000; // drops -> xrp
        console.log(`${walletType} (${address}) XRP Balance: ${balanceXRP} XRP for token ${tokenSymbol}`);
        return balanceXRP;
      } catch (error) {
        if (error.data?.error === "actNotFound") {
          console.log(`Wallet ${address} not found or not activated.`);
          return null;
        }
        throw error;
      }
    };

    const issuerBalance = await checkWalletBalance(issuerWallet.address, "Issuer");
    const receiverBalance = await checkWalletBalance(receiverWallet.address, "Receiver");

    if (issuerBalance === null || receiverBalance === null) {
      throw new Error("One or more wallets not activated. Fund them first.");
    }

    // Minimal: Issuer >= 10, Receiver >= 3
    if (issuerBalance < 10 || receiverBalance < 3) {
      throw new Error(
        `Insufficient balance. Issuer has ${issuerBalance} XRP, receiver has ${receiverBalance} XRP. 
         Issuer >= 10, Receiver >= 3.`
      );
    }
    console.log("Both wallets have sufficient balance.");

    // 5) Platform Fee: 6 XRP dari Issuer -> platformAddress
    const platformFeeTx = {
      TransactionType: "Payment",
      Account: issuerWallet.address,
      Amount: xrpl.xrpToDrops(6), // 6 XRP
      Destination: platformAddress,
    };
    const feePrepared = await client.autofill(platformFeeTx);
    const feeSigned = issuerWallet.sign(feePrepared);
    console.log("Submitting platform fee transaction...");
    const feeResult = await client.submitAndWait(feeSigned.tx_blob);
    if (feeResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Platform fee tx failed: ${feeResult.result.meta.TransactionResult}`);
    }
    console.log("Platform fee transaction succeeded:", feeSigned.hash);

    // 6) Issuer AccountSet (tanpa Domain)
    const issuerSettingsTx = {
      TransactionType: "AccountSet",
      Account: issuerWallet.address,
      TransferRate: 0,
      TickSize: 5,
      // Tidak ada "Domain" field
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
      Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
    };
    const issuerPrepared = await client.autofill(issuerSettingsTx);
    const issuerSigned = issuerWallet.sign(issuerPrepared);
    console.log("Submitting issuer AccountSet...");
    const issuerResult = await client.submitAndWait(issuerSigned.tx_blob);
    if (issuerResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Issuer AccountSet failed: ${issuerResult.result.meta.TransactionResult}`);
    }
    console.log("Issuer AccountSet succeeded:", issuerSigned.hash);

    // 7) Receiver AccountSet (tanpa Domain)
    const receiverSettingsTx = {
      TransactionType: "AccountSet",
      Account: receiverWallet.address,
      // Domain: "", // ditiadakan
      SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
      Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
    };
    const receiverPrepared = await client.autofill(receiverSettingsTx);
    const receiverSigned = receiverWallet.sign(receiverPrepared);
    console.log("Submitting receiver AccountSet...");
    const receiverResult = await client.submitAndWait(receiverSigned.tx_blob);
    if (receiverResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Receiver AccountSet failed: ${receiverResult.result.meta.TransactionResult}`);
    }
    console.log("Receiver AccountSet succeeded:", receiverSigned.hash);

    // 8) Konversi tokenSymbol jika > 3 huruf
    let currencyCode;
    if (tokenSymbol.length <= 3) {
      currencyCode = tokenSymbol; 
    } else {
      const hex = asciiToHex(tokenSymbol);
      currencyCode = padTo40Hex(hex);
    }

    // Tambahkan logging untuk memastikan currencyCode terdefinisi
    console.log("Currency Code:", currencyCode);

    // Pastikan issuerWallet.address terdefinisi
    if (!issuerWallet.address) {
      throw new Error("Issuer wallet address is undefined.");
    }

    // 9) Buat Trust Line (Receiver -> Issuer)
    const trustLineTx = {
      TransactionType: "TrustSet",
      Account: receiverWallet.address,
      LimitAmount: {
        currency: currencyCode,
        issuer: issuerWallet.address,
        value: "10000000000",
      },
    };
    const trustPrepared = await client.autofill(trustLineTx);
    const trustSigned = receiverWallet.sign(trustPrepared);
    console.log("Creating trust line...");
    const trustResult = await client.submitAndWait(trustSigned.tx_blob);
    if (trustResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`TrustSet failed: ${trustResult.result.meta.TransactionResult}`);
    }
    console.log("Trust line succeeded:", trustSigned.hash);

    // 10) Issue Tokens (Issuer -> Receiver)
    const issueTx = {
      TransactionType: "Payment",
      Account: issuerWallet.address,
      DeliverMax: {
        currency: currencyCode,
        value: tokenAmount.toString(),
        issuer: issuerWallet.address,
      },
      Destination: receiverWallet.address,
      DestinationTag: 1,
    };
    const issuePrepared = await client.autofill(issueTx);
    const issueSigned = issuerWallet.sign(issuePrepared);
    console.log("Issuing tokens...");
    const issueResult = await client.submitAndWait(issueSigned.tx_blob);
    if (issueResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Token issuance failed: ${issueResult.result.meta.TransactionResult}`);
    }
    console.log("Token issuance succeeded:", issueSigned.hash);

    // 11) Disconnect
    await client.disconnect();

    // 12) Buat Sologenic URL => ?market=<SYMBOL>%2B<ISSUER>%2FXRP
    const encodedSym = encodeURIComponent(currencyCode); // Gunakan currencyCode, bukan tokenSymbol
    const encodedIss = encodeURIComponent(issuerWallet.address);
    const sologenicUrl = `https://sologenic.org/trade?market=${encodedSym}%2B${encodedIss}%2FXRP`;

    // Tambahkan logging untuk memastikan URL benar
    console.log("Sologenic URL:", sologenicUrl);

    // Return success response
    res.status(200).json({
      message: "Token created successfully on Mainnet!",
      platformFeeTxHash: feeSigned.hash,
      txHashes: {
        issuerSettings: issuerSigned.hash,
        receiverSettings: receiverSigned.hash,
        trustLine: trustSigned.hash,
        tokenIssue: issueSigned.hash,
      },
      sologenicUrl,
    });
  } catch (error) {
    console.error("Error during Mainnet token creation:", error.message);
    res.status(500).json({ message: error.message });
  }
}
