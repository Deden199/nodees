
# Tap2Earn Crypto

## Project Overview
Tap2Earn Crypto is a gamified application with the following features:
- **Login with Telegram** for user authentication.
- **Wallet Management**: Generate and display XRP wallets.
- **TapTap Game**: Earn coins and level up by tapping within daily limits.
- **Rewards System**: View and share referral codes to earn points.
- **Admin Panel**: Manage users and update referral points..

## Setup Instructions

### 1. Install Dependencies
Run the following command to install all required dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root and configure the following variables:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
XRPL_NETWORK=wss://s.altnet.rippletest.net:51233
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

You can refer to the `.env.example` file for guidance.

### 3. Run the Development Server
Start the development server using:
```bash
npm run dev
```

### 4. Access the Application
Visit the application at `http://localhost:3000`.

## Features
- **Login Telegram**: Authenticate users via Telegram bot.
- **XRP Wallet**: Generate unique XRP wallets for users and display balances.
- **Game TapTap**: Daily tapping game with level progression and coin earning.
- **Rewards**: Referral-based rewards system.
- **Admin Panel**: Manage user data and referral points.

## Notes
- Ensure MongoDB and XRPL services are active and accessible.
- Update the Telegram bot domain using BotFather with `/setdomain` for proper widget functionality.

## License
This project is licensed under the MIT License.
