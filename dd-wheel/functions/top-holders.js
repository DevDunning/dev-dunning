import 'dotenv/config';
import { Connection, PublicKey } from '@solana/web3.js';

const TOKEN_MINT = process.env.TOKEN_MINT;
const RPC_URL = 'https://api.mainnet-beta.solana.com';

export async function handler() {
  if (!TOKEN_MINT) {
    return { statusCode: 500, body: 'TOKEN_MINT env variable missing' };
  }

  try {
    const connection = new Connection(RPC_URL);
    const mint = new PublicKey(TOKEN_MINT);

    // Fetch all token accounts for this mint
    const accounts = await connection.getParsedProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mint.toBase58() } }
        ]
      }
    );

    // Map accounts to wallet + balance
    const holders = accounts
      .map(acc => {
        const info = acc.account.data.parsed.info;
        return {
          wallet: info.owner,
          balance: Number(info.tokenAmount.uiAmount || 0)
        };
      })
      .filter(h => h.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holders: holders.map(h => h.wallet) })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
