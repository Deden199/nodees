import { rtdb } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  try {
    const { referralCode, userId } = req.body;

    if (!referralCode || !userId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Cari user dengan referralCode
    const usersRef = rtdb.ref("users");
    const snapshot = await usersRef.orderByChild("referralCode").equalTo(referralCode).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "Referral code not found." });
    }

    // Dapatkan data pengguna pemilik referralCode
    const referralUserId = Object.keys(snapshot.val())[0];
    const referralUser = snapshot.val()[referralUserId];

    // Tambahkan 100 poin ke referralUser
    const newPoints = (referralUser.points || 0) + 100;
    await rtdb.ref(`users/${referralUserId}`).update({ points: newPoints });

    // Tandai bahwa userId telah menggunakan referralCode ini
    const newUserData = {
      referredBy: referralCode,
    };
    await rtdb.ref(`users/${userId}`).update(newUserData);

    res.status(200).json({ message: "Referral successful", points: newPoints });
  } catch (error) {
    console.error("Error processing referral:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
