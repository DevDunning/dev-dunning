import { Redis } from '@upstash/redis';
import { Connection, PublicKey } from '@solana/web3.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const connection = new Connection('https://api.mainnet-beta.solana.com');
const TOKEN_MINT = new PublicKey(process.env.TOKEN_MINT);

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { wallet } = JSON.parse(event.body);
  if (!wallet || !wallet.match(/^[\w\-.]{32,44}$/)) return { statusCode: 400, body: 'Invalid wallet address' };

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), { mint: TOKEN_MINT });
    let balance = 0;
    if (tokenAccounts.value.length > 0) {
      balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
    }

    let maxSpins = 0;
    if (balance >= 2000000) maxSpins = 3;
    else if (balance >= 1000000) maxSpins = 2;
    else if (balance >= 500000) maxSpins = 1;

    const today = new Date().toISOString().split('T')[0];
    const key = `spins:${wallet}:${today}`;
    const usedStr = await redis.get(key);
    const usedSpins = usedStr ? parseInt(usedStr) : 0;
    const available = Math.max(0, maxSpins - usedSpins);

    return {
      statusCode: 200,
      body: JSON.stringify({ available, maxSpins, balance, used: usedSpins })
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}
