
import xrpl from "xrpl";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  try {
    // Create a new wallet locally
    const wallet = xrpl.Wallet.generate();

    // Fund wallet on Testnet using the faucet
    const response = await fetch("https://faucet.altnet.rippletest.net/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: wallet.classicAddress }),
    });

    if (!response.ok) {
      throw new Error("Failed to fund wallet using Testnet faucet.");
    }

    // Return wallet details including seed
    const result = await response.json();
    res.status(200).json({
      message: "Wallet funded successfully.",
      wallet: {
        address: wallet.classicAddress,
        seed: wallet.seed,
        transactionHash: result.txnHash,
      },
    });
  } catch (error) {
    console.error("Error funding wallet:", error.message);
    res.status(500).json({ message: error.message });
  }
}
