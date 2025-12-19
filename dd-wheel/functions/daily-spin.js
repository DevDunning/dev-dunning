import 'dotenv/config';
import { Redis } from '@upstash/redis';
import { Connection, PublicKey } from '@solana/web3.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const TOKEN_MINT = process.env.TOKEN_MINT;
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const DAILY_PRIZE = 10000; // default prize amount

export async function handler() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const winnerKey = `daily:winner:${today}`;

    // Prevent double execution
    const existing = await redis.get(winnerKey);
    if (existing) {
      return { statusCode: 200, body: 'Already spun today' };
    }

    // Fetch top 10 holders from Solana
    const connection = new Connection(RPC_URL);
    const mint = new PublicKey(TOKEN_MINT);

    const accounts = await connection.getParsedProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mint.toBase58() } }
        ]
      }
    );

    const top10 = accounts
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

    if (top10.length === 0) throw new Error('No eligible holders today');

    // Pick a winner randomly from top 10
    const winner = top10[Math.floor(Math.random() * top10.length)];

    const record = {
      wallet: winner.wallet,
      prize: DAILY_PRIZE,
      date: new Date().toISOString(),
      snapshot: top10.map(h => h.wallet) // for frontend visualization
    };

    // Store winner
    await redis.set(winnerKey, JSON.stringify(record));

    // Update recent winners (last 10)
    const recentKey = 'daily:winners:recent';
    const recent = JSON.parse((await redis.get(recentKey)) || '[]');
    recent.unshift(record);
    await redis.set(recentKey, JSON.stringify(recent.slice(0, 10)));

    return {
      statusCode: 200,
      body: JSON.stringify(record)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
