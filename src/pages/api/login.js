import { rtdb } from "../../utils/firebaseAdmin";
import { Wallet, Client } from "xrpl";
import { v4 as uuidv4 } from "uuid";

const XRPL_RPC_URL = "wss://xrplcluster.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  try {
    const { id, first_name, last_name = "", username = "", referrerId = null } = req.body;

    if (!id || !first_name) {
      return res.status(400).json({ message: "Missing required fields: id or first_name." });
    }

    const userRef = rtdb.ref(`users/${id}`);
    const userSnapshot = await userRef.get();

    let wallet;
    let referralCode;

    if (!userSnapshot.exists()) {
      console.log("New user detected. Generating wallet...");
      const generatedWallet = Wallet.generate();
      wallet = {
        private_key: generatedWallet.seed,
        public_address: generatedWallet.classicAddress,
      };

      referralCode = uuidv4().slice(0, 8); // Generate unique referral code

      const initialData = {
        user_id: id,
        first_name,
        last_name,
        username,
        wallet,
        referralCode,
        points: referrerId ? 500 : 0, // Bonus for new user referred
        referredBy: referrerId || null,
        createdAt: new Date().toISOString(),
        isActivated: false,
      };

      await userRef.set(initialData);

      if (referrerId && referrerId !== id) {
        const referrerRef = rtdb.ref(`users/${referrerId}`);
        await referrerRef.transaction((currentData) => {
          if (currentData) {
            currentData.points = (currentData.points || 0) + 1000; // Bonus for referrer
          }
          return currentData;
        });
        console.log(`Referrer ${referrerId} rewarded with 1000 points.`);
      }
    } else {
      console.log("User already exists. Validating data completeness...");
      const userData = userSnapshot.val();

      // Ensure wallet and referral code exist
      wallet = userData.wallet || {
        private_key: "",
        public_address: "",
      };

      if (!userData.wallet || !userData.wallet.public_address) {
        const generatedWallet = Wallet.generate();
        wallet = {
          private_key: generatedWallet.seed,
          public_address: generatedWallet.classicAddress,
        };
      }

      referralCode = userData.referralCode || uuidv4().slice(0, 8);

      const updatedData = {
        ...userData,
        wallet,
        referralCode,
      };

      await userRef.update(updatedData);
      console.log("User data updated for completeness.");
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
      isActivated = parseInt(balance, 10) >= 900000; // Activation threshold
    } catch (error) {
      console.error("Error fetching XRP balance:", error.message);
    } finally {
      await client.disconnect();
    }

    // Update activation status in Firebase
    await userRef.update({ isActivated });

    res.status(200).json({
      message: "Login successful",
      wallet,
      balance,
      isActivated,
      referralCode,
      userId: id,
      redirectUrl: `/jack-home?user_id=${id}`,
    });
  } catch (error) {
    console.error("Error during login process:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
