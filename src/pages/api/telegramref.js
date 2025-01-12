import { Telegraf } from "telegraf";
import { rtdb } from "../../utils/firebaseAdmin";
import { Wallet } from "xrpl";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  try {
    const referrerId = ctx.message.text.split(" ")[1]; // Get referral payload
    const newUserId = ctx.from.id;

    const userRef = rtdb.ref(`users/${newUserId}`);
    const userSnapshot = await userRef.once("value");
    let userData = userSnapshot.val();

    // Generate wallet if missing
    let wallet = userData?.wallet || null;
    if (!wallet || !wallet.public_address || !wallet.private_key) {
      console.log("Generating wallet for new user...");
      const generatedWallet = Wallet.generate();
      wallet = {
        public_address: generatedWallet.classicAddress,
        private_key: generatedWallet.seed,
      };
    }

    // Default initial data structure
    const initialData = {
      user_id: newUserId,
      first_name: ctx.from.first_name || "Unknown",
      last_name: ctx.from.last_name || "",
      username: ctx.from.username || "",
      wallet,
      points: 0,
      referredBy: null,
      createdAt: userData?.createdAt || new Date().toISOString(),
      isActivated: userData?.isActivated || false,
    };

    // If user does not exist, create initial data
    if (!userData) {
      console.log("New user detected. Creating user data...");
      await userRef.set(initialData);
      userData = initialData;
    } else {
      // Ensure existing data is complete
      const updatedData = { ...initialData, ...userData, wallet };
      await userRef.update(updatedData);
      userData = updatedData;
    }

    // Handle referral logic
    if (referrerId && referrerId !== String(newUserId)) {
      if (userData.referredBy) {
        await ctx.reply("You have already used a referral link.");
      } else {
        console.log(`User ${newUserId} referred by ${referrerId}`);
        await userRef.update({ referredBy: referrerId });

        const referrerRef = rtdb.ref(`users/${referrerId}`);
        const referrerSnapshot = await referrerRef.once("value");
        const referrerData = referrerSnapshot.val();

        if (referrerData) {
          const referrerPoints = (referrerData.points || 0) + 1000; // Points for referrer
          const newUserPoints = (userData.points || 0) + 500; // Points for new user

          await referrerRef.update({ points: referrerPoints });
          await userRef.update({ points: newUserPoints });

          await ctx.reply(
            "Welcome! You have received 500 coins for joining through a referral link."
          );
          await bot.telegram.sendMessage(
            referrerId,
            "Your referral has joined! You have earned 1000 coins."
          );
        } else {
          console.warn(`Invalid referrer ID: ${referrerId}`);
          await ctx.reply("Invalid referral link.");
        }
      }
    } else {
      await ctx.reply("Welcome to XRPLNode Project! Please launch the app from the menu.");
    }
  } catch (error) {
    console.error("Error handling /start:", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await bot.handleUpdate(req.body); // Handle webhook
    } catch (error) {
      console.error("Error handling webhook:", error);
    }
    res.status(200).send("OK");
  } else {
    res.status(200).send("Bot is running!");
  }
}
