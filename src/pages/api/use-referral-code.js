import { rtdb } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed. Use GET." });
  }

  try {
    const { user_id, referral_code } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const userRef = rtdb.ref(`users/${user_id}`);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists()) {
      return res.status(404).json({ message: "User not found in database." });
    }

    const userData = userSnapshot.val();
    const currentUserReferralCode = userData.referralCode || null;

    // Cek apakah kode referral dikirimkan dan belum pernah digunakan
    if (referral_code && currentUserReferralCode !== referral_code) {
      const usedReferralCodes = userData.usedReferralCodes || [];

      if (!usedReferralCodes.includes(referral_code)) {
        const usersRef = rtdb.ref("users");
        const referralSnapshot = await usersRef
          .orderByChild("referralCode")
          .equalTo(referral_code)
          .once("value");

        if (referralSnapshot.exists()) {
          const referrerUserId = Object.keys(referralSnapshot.val())[0];
          const referrerData = referralSnapshot.val()[referrerUserId];

          // Tambahkan poin untuk referrer
          const newReferrerPoints = (referrerData.points || 0) + 100;
          await rtdb.ref(`users/${referrerUserId}`).update({ points: newReferrerPoints });

          // Tambahkan poin untuk user dan log kode referral
          const newUserPoints = (userData.points || 0) + 50;
          await userRef.update({
            points: newUserPoints,
            usedReferralCodes: [...usedReferralCodes, referral_code],
          });

          return res.status(200).json({
            message: "Referral code applied successfully!",
            user: { points: newUserPoints },
          });
        }
      }
    }

    return res.status(200).json({
      user: {
        id: user_id,
        points: userData.points || 0,
        referralCode: currentUserReferralCode,
      },
    });
  } catch (error) {
    console.error("Error processing referral:", error.message);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
