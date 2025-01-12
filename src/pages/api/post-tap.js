import { rtdb } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  try {
    const { user_id, totalIncrement, totalTaps } = req.body;

    if (!user_id || typeof totalIncrement !== "number" || typeof totalTaps !== "number") {
      return res.status(400).json({ message: "Missing or invalid required fields." });
    }

    const userRef = rtdb.ref(`users/${user_id}`);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists()) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = userSnapshot.val();
    const currentPoints = userData.points || 0;
    const currentTaps = userData.dailyTaps || 0;
    const dailyTapLimit = 6500;

    if (currentTaps + totalTaps > dailyTapLimit) {
      return res.status(403).json({
        message: `Daily tap limit of ${dailyTapLimit} reached.`,
        remainingTaps: dailyTapLimit - currentTaps,
      });
    }

    const updatedPoints = currentPoints + totalIncrement;
    const updatedTaps = currentTaps + totalTaps;

    await userRef.update({
      points: updatedPoints,
      dailyTaps: updatedTaps,
    });

    res.status(200).json({
      updatedPoints,
      updatedTaps,
      remainingTaps: dailyTapLimit - updatedTaps,
      message: "Tap update successful.",
    });
  } catch (error) {
    console.error("Error during tap process:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
