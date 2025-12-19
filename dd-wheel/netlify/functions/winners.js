import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = new Redis({ url: redisUrl, token: redisToken });

export async function handler() {
  try {
    const keys = await redis.keys('daily-winner:*');
    const sortedKeys = keys.sort().reverse().slice(0, 10);

    const winners = [];
    for (const key of sortedKeys) {
      const raw = await redis.get(key);
      if (raw) winners.push(JSON.parse(raw));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(winners)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
