import type { NextApiRequest, NextApiResponse } from 'next';
const xrpl = require("xrpl");

type Data = {
  address: string;
  seed: string;
};

type ErrorType = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorType>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Debugging to check module loading
    console.log("XRPL Client:", typeof xrpl.Client);
    console.log("XRPL Wallet:", typeof xrpl.Wallet);

    const client = new xrpl.Client('wss://xrplcluster.com'); // Alternative WebSocket
    await client.connect();
    console.log("Connected to XRPL");

    const wallet = xrpl.Wallet.generate();
    console.log("Generated Wallet:", wallet);

    await client.disconnect();
    console.log("Disconnected from XRPL");

    if (!wallet.classicAddress || !wallet.seed) {
      throw new Error('Failed to generate wallet: Missing address or seed');
    }

    return res.status(200).json({
      address: wallet.classicAddress,
      seed: wallet.seed,
    });
  } catch (error: unknown) {
    console.error("Error in handler:", error);
    const errorMsg = (error as Error).message || 'Internal Server Error';
    return res.status(500).json({ message: errorMsg });
  }
}
