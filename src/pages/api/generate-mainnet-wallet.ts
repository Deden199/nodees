// pages/api/generate-mainnet-wallet.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import xrpl from 'xrpl';

type Data = {
  address: string;
  seed: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data | { error: string }>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Inisialisasi koneksi ke Mainnet
    const client = new xrpl.Client('wss://s2.ripple.com');
    await client.connect();

    // Generate wallet
    const wallet = xrpl.Wallet.generate();

    // Disconnect setelah selesai
    await client.disconnect();

    // Pastikan bahwa address dan seed ada sebelum mengirimkannya
    if (!wallet.classicAddress || !wallet.seed) {
      throw new Error('Failed to generate wallet: Missing address or seed');
    }

    // Kirim respons
    return res.status(200).json({
      address: wallet.classicAddress, // Sudah dicek, pasti string
      seed: wallet.seed, // Sudah dicek, pasti string
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
