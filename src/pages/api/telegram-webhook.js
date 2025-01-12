import { MongoClient } from "mongodb";
import xrpl from "xrpl";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message } = req.body;

  if (message.text === "/start") {
    const telegram_user_id = message.chat.id;
    const first_name = message.chat.first_name || "";
    const last_name = message.chat.last_name || "";
    const username = message.chat.username || "";

    const client = new MongoClient(process.env.MONGO_URI);

    try {
      await client.connect();
      const db = client.db("tap2earn");
      const usersCollection = db.collection("taptap");

      let user = await usersCollection.findOne({ telegram_user_id });
      let wallet;

      if (!user) {
        // Generate a new XRPL wallet
        const generatedWallet = xrpl.Wallet.generate();

        user = {
          telegram_user_id,
          first_name,
          last_name,
          username,
          createdAt: new Date(),
          walletAddress: generatedWallet.classicAddress,
          walletPrivateKey: generatedWallet.seed,
        };

        await usersCollection.insertOne(user);

        wallet = {
          address: generatedWallet.classicAddress,
          privateKey: generatedWallet.seed,
        };
      } else {
        wallet = {
          address: user.walletAddress,
          privateKey: user.walletPrivateKey,
        };
      }

      // Gunakan `wallet` untuk logging atau debugging
      console.log("Wallet created or retrieved:", wallet);

      // Respond with a link to the home page
      const homePageUrl = `https://xxsd.vercel.app/jack-home?user_id=${telegram_user_id}`;
      const BOT_TOKEN = process.env.BOT_TOKEN;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegram_user_id,
          text: `Welcome! Click the link below to access your dashboard:\n${homePageUrl}`,
        }),
      });

      res.status(200).json({ 
        message: "User data processed successfully",
        wallet // Sertakan wallet dalam respons jika diperlukan
      });
    } catch (error) {
      console.error("Error processing Telegram message:", error);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      await client.close();
    }
  } else {
    res.status(200).json({ message: "No action taken" });
  }
}
