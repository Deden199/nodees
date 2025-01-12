import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "my_database";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ telegram_user_id: parseInt(user_id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.close();
  }
}
