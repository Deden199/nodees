
import xrpl from 'xrpl';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ message: 'Wallet address is required' });
    }

    const client = new xrpl.Client(process.env.XRPL_NETWORK);
    try {
        await client.connect();

        const response = await client.request({
            command: 'account_info',
            account: address,
            ledger_index: 'validated',
        });

        const balance = parseFloat(response.result.account_data.Balance) / 1000000; // Convert drops to XRP
        res.status(200).json({ balance });
    } catch (error) {
        console.error('Error fetching XRP balance:', error);
        res.status(500).json({ message: 'Error fetching XRP balance' });
    } finally {
        client.disconnect();
    }
}
