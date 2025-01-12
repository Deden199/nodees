import { rtdb } from "../../utils/firebaseAdmin";
import { Client, Wallet } from "xrpl";

const XRPL_RPC_URL = "wss://xrplcluster.com";

export default async function handler(req, res) {
  console.log("Request received:", { method: req.method, url: req.url });

  if (req.method === "GET") {
    try {
      const { user_id, referral_code } = req.query;

      if (!user_id) {
        console.error("User ID is missing in the request.");
        return res.status(400).json({ message: "User ID is required." });
      }

      console.log(`Looking up user with ID: ${user_id}`);

      const userRef = rtdb.ref(`users/${user_id}`);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists()) {
        console.error(`User with ID ${user_id} not found in Firebase.`);
        return res.status(404).json({ message: "User not found in database." });
      }

      const userData = userSnapshot.val();
      const wallet = userData.wallet || { public_address: null, private_key: null };

      if (!wallet.public_address) {
        console.error(`Wallet public address is missing for user: ${user_id}`);
        return res.status(400).json({ message: "Wallet public address is missing." });
      }

      const referralCode = userData.referralCode || "N/A";
      const points = userData.points || 0;
      const usedReferralCodes = userData.usedReferralCodes || [];
      let isActivated = userData.isActivated || false;

      console.log(`Checking XRP balance for wallet: ${wallet.public_address}`);

      const client = new Client(XRPL_RPC_URL);
      let xrpBalance = "0";

      try {
        await client.connect();
        const response = await client.request({
          command: "account_info",
          account: wallet.public_address,
          ledger_index: "validated",
        });
        xrpBalance = response.result.account_data.Balance || "0";
        isActivated = parseInt(xrpBalance, 10) >= 900000; // Activation threshold (0.9 XRP)
        console.log(`XRP Balance: ${xrpBalance}, Activated: ${isActivated}`);
      } catch (error) {
        console.error("Error fetching XRP balance:", error.message);
      } finally {
        client.disconnect();
      }

      // Update activation status in Firebase
      try {
        console.log("Updating activation status in Firebase...");
        await userRef.update({ isActivated });
        console.log("Activation status updated successfully.");
      } catch (error) {
        console.error("Error updating activation status in Firebase:", error.message);
      }

      // Referral Logic
      if (referral_code) {
        if (referral_code === referralCode) {
          console.error("Self-referral is not allowed.");
          return res.status(400).json({ message: "Self-referral is not allowed." });
        }

        if (!usedReferralCodes.includes(referral_code)) {
          console.log(`Processing referral code: ${referral_code}`);

          const usersRef = rtdb.ref("users");
          const referralSnapshot = await usersRef
            .orderByChild("referralCode")
            .equalTo(referral_code)
            .once("value");

          if (referralSnapshot.exists()) {
            const referrerUserId = Object.keys(referralSnapshot.val())[0];
            const referrerData = referralSnapshot.val()[referrerUserId];

            // Reward both referrer and user
            const referrerPoints = (referrerData.points || 0) + 3000; // Referrer reward
            const newUserPoints = points + 1000; // User reward

            await rtdb.ref(`users/${referrerUserId}`).update({ points: referrerPoints });
            await userRef.update({
              points: newUserPoints,
              usedReferralCodes: [...usedReferralCodes, referral_code],
            });

            console.log(`Referral processed: User ${user_id} and Referrer ${referrerUserId} rewarded.`);
          } else {
            console.error(`Invalid referral code: ${referral_code}`);
          }
        } else {
          console.log(`Referral code already used: ${referral_code}`);
        }
      }

      return res.status(200).json({
        user: {
          id: user_id,
          referralCode,
          points,
          wallet,
          isActivated,
          xrpBalance,
        },
      });
    } catch (error) {
      console.error("Error during get user process:", error.message);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { issuer, privateKey } = req.body;

      if (!issuer || !privateKey) {
        return res.status(400).json({ message: "Missing required fields: issuer or privateKey." });
      }

      const client = new Client(XRPL_RPC_URL);

      try {
        await client.connect();

        const wallet = Wallet.fromSeed(privateKey);

        const trustlineTransaction = {
          TransactionType: "TrustSet",
          Account: wallet.classicAddress,
          LimitAmount: {
            currency: "XQN",
            issuer: issuer,
            value: "1000000000", // Maximum trustline limit
          },
        };

        const prepared = await client.autofill(trustlineTransaction);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta.TransactionResult === "tesSUCCESS") {
          console.log("Trustline successfully set.");
          return res.status(200).json({ message: "Trustline successfully set." });
        } else {
          throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
        }
      } catch (error) {
        console.error("Error setting Trustline:", error.message);
        return res.status(500).json({ message: error.message });
      } finally {
        await client.disconnect();
      }
    } catch (error) {
      console.error("Error processing request:", error.message);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed." });
}
