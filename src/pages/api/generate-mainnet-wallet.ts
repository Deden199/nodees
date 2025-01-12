// src/pages/api/generate-mainnet-wallet.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import xrpl from 'xrpl';

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
    const client = new xrpl.Client('wss://s2.ripple.com');
    await client.connect();
    const wallet = xrpl.Wallet.generate();
    await client.disconnect();

    if (!wallet.classicAddress || !wallet.seed) {
      throw new Error('Failed to generate wallet: Missing address or seed');
    }

    return res.status(200).json({
      address: wallet.classicAddress,
      seed: wallet.seed,
    });
  } catch (error: unknown) {
    console.error(error);
    const errorMsg = (error as Error).message || 'Internal Server Error';
    return res.status(500).json({ message: errorMsg });
  }
}
