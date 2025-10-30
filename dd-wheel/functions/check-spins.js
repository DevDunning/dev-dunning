import 'dotenv/config';
import { Redis } from '@upstash/redis';
import { Connection, PublicKey } from '@solana/web3.js';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const TOKEN_MINT = process.env.TOKEN_MINT;

const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;
const connection = new Connection('https://api.mainnet-beta.solana.com');

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  if (!TOKEN_MINT) return { statusCode: 500, body: 'TOKEN_MINT env variable missing' };
  const tokenMint = new PublicKey(TOKEN_MINT);

  const { wallet } = JSON.parse(event.body);
  if (!wallet || !wallet.match(/^[\w\-.]{32,44}$/))
    return { statusCode: 400, body: 'Invalid wallet address' };

  try {
    let balance = 0;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(wallet),
      { mint: tokenMint }
    );
    if (tokenAccounts.value.length > 0) {
      balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
    }

    let maxSpins = 0;
    if (balance >= 2000000) maxSpins = 3;
    else if (balance >= 1000000) maxSpins = 2;
    else if (balance >= 500000) maxSpins = 1;

    const today = new Date().toISOString().split('T')[0];
    const key = `spins:${wallet}:${today}`;
    let usedSpins = 0;
    if (redis) {
      const usedStr = await redis.get(key);
      usedSpins = usedStr ? parseInt(usedStr) : 0;
    }

    const available = Math.max(0, maxSpins - usedSpins);

    return {
      statusCode: 200,
      body: JSON.stringify({ available, maxSpins, balance, used: usedSpins })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
