// pages/api/create-token-testnet.js (atau .ts)

const xrpl = require("xrpl");


// Helper functions
function asciiToHex(str) {
  return Buffer.from(str, "ascii").toString("hex").toUpperCase();
}

function padTo40Hex(hexString) {
  const maxLength = 40;
  if (hexString.length > maxLength) {
    throw new Error(`Token symbol is too long to fit into 160-bit hex (40 hex digits).`);
  }
  // Pad with zeros on the right until length = 40
  return hexString.padEnd(maxLength, "0");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  const { issuerSeed, receiverSeed, tokenSymbol, tokenAmount } = req.body;

  // Validate required fields
  if (!issuerSeed || !receiverSeed || !tokenSymbol || !tokenAmount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    console.log("Connecting to Testnet...");
    await client.connect();

    // Generate wallets from provided seeds
    const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);
    const receiverWallet = xrpl.Wallet.fromSeed(receiverSeed);

    console.log("Issuer Wallet Address:", issuerWallet.address);
    console.log("Receiver Wallet Address:", receiverWallet.address);

    // ---------------------------
    // 1) Configure Issuer (Cold)
    // ---------------------------
    const issuerSettingsTx = {
      TransactionType: "AccountSet",
      Account: issuerWallet.address,
      TransferRate: 0,
      TickSize: 5,
      Domain: Buffer.from("example.com").toString("hex"),
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
      Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
    };

    const issuerSettingsPrepared = await client.autofill(issuerSettingsTx);
    const issuerSettingsSigned = issuerWallet.sign(issuerSettingsPrepared);
    console.log("Submitting issuer AccountSet transaction...");
    const issuerSettingsResult = await client.submitAndWait(issuerSettingsSigned.tx_blob);

    if (issuerSettingsResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Issuer AccountSet failed: ${issuerSettingsResult.result.meta.TransactionResult}`);
    }

    console.log(`Issuer settings transaction succeeded: ${issuerSettingsSigned.hash}`);

    // ---------------------------
    // 2) Configure Receiver (Hot)
    // ---------------------------
    const receiverSettingsTx = {
      TransactionType: "AccountSet",
      Account: receiverWallet.address,
      Domain: Buffer.from("example.com").toString("hex"),
      SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
      Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
    };

    const receiverSettingsPrepared = await client.autofill(receiverSettingsTx);
    const receiverSettingsSigned = receiverWallet.sign(receiverSettingsPrepared);
    console.log("Submitting receiver AccountSet transaction...");
    const receiverSettingsResult = await client.submitAndWait(receiverSettingsSigned.tx_blob);

    if (receiverSettingsResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Receiver AccountSet failed: ${receiverSettingsResult.result.meta.TransactionResult}`);
    }

    console.log(`Receiver settings transaction succeeded: ${receiverSettingsSigned.hash}`);

    // ---------------------------
    // 3) Create Trust Line (Receiver -> Issuer)
    //     - Convert symbol if length > 3
    // ---------------------------
    let currencyCode;
    if (tokenSymbol.length <= 3) {
      // <= 3 ASCII => direct
      currencyCode = tokenSymbol;
    } else {
      // > 3 => convert to 160-bit hex
      const hex = asciiToHex(tokenSymbol); // e.g. "SHIBA" => "5348494241"
      currencyCode = padTo40Hex(hex);      // pad to 40 hex digits
    }

    const trustLineTx = {
      TransactionType: "TrustSet",
      Account: receiverWallet.address,
      LimitAmount: {
        currency: currencyCode,
        issuer: issuerWallet.address,
        value: "10000000000", // Arbitrary high limit
      },
    };

    const trustLinePrepared = await client.autofill(trustLineTx);
    const trustLineSigned = receiverWallet.sign(trustLinePrepared);
    console.log("Creating trust line...");
    const trustLineResult = await client.submitAndWait(trustLineSigned.tx_blob);

    if (trustLineResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`TrustSet transaction failed: ${trustLineResult.result.meta.TransactionResult}`);
    }

    console.log(`Trust line transaction succeeded: ${trustLineSigned.hash}`);

    // ---------------------------
    // 4) Issue Tokens (Issuer -> Receiver)
    // ---------------------------
    const issueTokensTx = {
      TransactionType: "Payment",
      Account: issuerWallet.address,
      DeliverMax: {
        currency: currencyCode, // important to use the same code
        value: tokenAmount.toString(),
        issuer: issuerWallet.address,
      },
      Destination: receiverWallet.address,
      DestinationTag: 1, // Example destination tag
    };

    const issueTokensPrepared = await client.autofill(issueTokensTx);
    const issueTokensSigned = issuerWallet.sign(issueTokensPrepared);
    console.log("Issuing tokens...");
    const issueTokensResult = await client.submitAndWait(issueTokensSigned.tx_blob);

    if (issueTokensResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Token issuance failed: ${issueTokensResult.result.meta.TransactionResult}`);
    }

    console.log(`Token issuance transaction succeeded: ${issueTokensSigned.hash}`);

    // ---------------------------
    // 5) Fetch Balances
    // ---------------------------
    const getBalances = async (address) => {
      const accountLines = await client.request({
        command: "account_lines",
        account: address,
        ledger_index: "validated",
      });
      return accountLines.result.lines.map((line) => ({
        currency: line.currency,
        balance: line.balance,
        issuer: line.account,
      }));
    };

    const issuerBalances = await getBalances(issuerWallet.address);
    const receiverBalances = await getBalances(receiverWallet.address);

    await client.disconnect();

    // Return success response
    res.status(200).json({
      message: "Token created successfully!",
      txHashes: {
        issuerSettings: issuerSettingsSigned.hash,
        receiverSettings: receiverSettingsSigned.hash,
        trustLine: trustLineSigned.hash,
        tokenIssue: issueTokensSigned.hash,
      },
      balances: {
        issuer: issuerBalances,
        receiver: receiverBalances,
      },
    });
  } catch (error) {
    console.error("Error during Testnet token creation:", error.message);
    res.status(500).json({ message: error.message });
  }
}
