import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = new Redis({ url: redisUrl, token: redisToken });

export async function handler() {
  try {
    // Assume you already store balances in Redis: "holders:<wallet>" = balance
    const keys = await redis.keys('holders:*');
    const allHolders = [];

    for (const key of keys) {
      const balance = parseInt(await redis.get(key));
      allHolders.push({ wallet: key.replace('holders:', ''), balance });
    }

    // Sort descending
    allHolders.sort((a, b) => b.balance - a.balance);

    const top10 = allHolders.slice(0, 10);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(top10)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
