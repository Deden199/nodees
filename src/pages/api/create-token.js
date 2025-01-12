const xrpl = require("xrpl");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  const { issuerSeed, receiverSeed, tokenSymbol, tokenAmount } = req.body;

  if (!issuerSeed || !receiverSeed || !tokenSymbol || !tokenAmount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const client = new xrpl.Client("wss://s1.ripple.com/");
    console.log("Connecting to Mainnet...");
    await client.connect();

    // Generate wallets from provided seeds
    const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);
    const receiverWallet = xrpl.Wallet.fromSeed(receiverSeed);

    console.log("Issuer Wallet Address:", issuerWallet.address);
    console.log("Receiver Wallet Address:", receiverWallet.address);

    // Check wallet activation and balance
    const checkWalletBalance = async (address) => {
      try {
        const accountInfo = await client.request({
          command: "account_info",
          account: address,
          ledger_index: "validated",
        });
        return parseInt(accountInfo.result.account_data.Balance, 10) / 1_000_000;
      } catch (error) {
        if (error.data?.error === "actNotFound") {
          console.log(`Wallet ${address} not found. Ensure it has sufficient XRP balance.`);
          return null; // Wallet not activated
        }
        throw error;
      }
    };

    const issuerBalance = await checkWalletBalance(issuerWallet.address);
    const receiverBalance = await checkWalletBalance(receiverWallet.address);

    if (issuerBalance === null || receiverBalance === null) {
      throw new Error(
        "One or more wallets are not activated. Fund wallets with sufficient XRP to proceed."
      );
    }

    if (issuerBalance < 10 || receiverBalance < 10) {
      throw new Error(
        "Insufficient balance. Ensure both wallets have at least 10 XRP for fees and transactions."
      );
    }

    console.log("Both wallets are activated and have sufficient balance.");

    // Step 1: Configure Issuer (Cold Wallet) Settings
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

    // Step 2: Configure Receiver (Hot Wallet) Settings
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

    // Step 3: Create Trust Line from Receiver to Issuer
    const trustLineTx = {
      TransactionType: "TrustSet",
      Account: receiverWallet.address,
      LimitAmount: {
        currency: tokenSymbol,
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

    // Step 4: Issue Tokens from Issuer to Receiver
    const issueTokensTx = {
      TransactionType: "Payment",
      Account: issuerWallet.address,
      DeliverMax: {
        currency: tokenSymbol,
        value: tokenAmount.toString(),
        issuer: issuerWallet.address,
      },
      Destination: receiverWallet.address,
      DestinationTag: 1,
    };

    const issueTokensPrepared = await client.autofill(issueTokensTx);
    const issueTokensSigned = issuerWallet.sign(issueTokensPrepared);
    console.log("Issuing tokens...");
    const issueTokensResult = await client.submitAndWait(issueTokensSigned.tx_blob);

    if (issueTokensResult.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Token issuance failed: ${issueTokensResult.result.meta.TransactionResult}`);
    }

    console.log(`Token issuance transaction succeeded: ${issueTokensSigned.hash}`);

    await client.disconnect();

    // Generate Sologenic trading pair URL
    const sologenicUrl = `https://sologenic.org/trade/${issuerWallet.address}:${tokenSymbol}-XRP`;

    // Return success response
    res.status(200).json({
      message: "Token created successfully on Mainnet!",
      txHashes: {
        issuerSettings: issuerSettingsSigned.hash,
        receiverSettings: receiverSettingsSigned.hash,
        trustLine: trustLineSigned.hash,
        tokenIssue: issueTokensSigned.hash,
      },
      sologenicUrl,
    });
  } catch (error) {
    console.error("Error during Mainnet token creation:", error.message);
    res.status(500).json({ message: error.message });
  }
}
