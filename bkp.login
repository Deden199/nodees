import { rtdb } from "../../utils/firebaseAdmin";
import { Wallet, Client } from "xrpl";
import { v4 as uuidv4 } from "uuid";

const XRPL_RPC_URL = "wss://xrplcluster.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  try {
    const { id, first_name, last_name = "", username = "" } = req.body;

    if (!id || !first_name) {
      return res.status(400).json({ message: "Missing required fields: id or first_name." });
    }

    const userRef = rtdb.ref(`users/${id}`);
    const userSnapshot = await userRef.get();

    let wallet;
    let referralCode;

    if (userSnapshot.exists()) {
      console.log("User already exists. Fetching existing data...");
      const userData = userSnapshot.val();
      wallet = userData.wallet;
      referralCode = userData.referralCode;
    } else {
      console.log("New user. Generating wallet...");
      const generatedWallet = Wallet.generate();
      wallet = {
        public_address: generatedWallet.classicAddress,
        private_key: generatedWallet.seed,
      };

      referralCode = uuidv4().slice(0, 8); // Generate unique referral code

      await userRef.set({
        user_id: id,
        first_name,
        last_name,
        username,
        wallet,
        referralCode,
        points: 0,
        createdAt: new Date().toISOString(),
        isActivated: false,
      });
    }

    // Check wallet activation status
    const client = new Client(XRPL_RPC_URL);
    let balance = "0";
    let isActivated = false;

    try {
      await client.connect();
      const response = await client.request({
        command: "account_info",
        account: wallet.public_address,
        ledger_index: "validated",
      });
      balance = response.result.account_data.Balance || "0";
      isActivated = parseInt(balance, 10) >= 900000; // Updated threshold to 0.9 XRP (900,000 drops)
    } catch (error) {
      console.error("Error fetching XRP balance:", error.message);
    } finally {
      await client.disconnect();
    }

    // Update activation status in Firebase
    await userRef.update({ isActivated });
    const botUsername = "XRPLNode_Bot"; // Ganti dengan username bot Anda

    // Generate Telegram deep link
    const telegramLink = `https://t.me/${botUsername}?start=${id}`;

    res.status(200).json({
      message: "Login successful",
      wallet,
      balance,
      isActivated,
      referralCode,
      userId: id,
      redirectUrl: `/jack-home?user_id=${id}`,
      telegramLink, // Add Telegram deep link to the response
    });
  } catch (error) {
    console.error("Error during login process:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
