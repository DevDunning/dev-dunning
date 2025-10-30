import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function handler() {
  try {
    let prizesStr = await redis.get('rewards:prizes');
    let prizes = [];

    try {
      prizes = prizesStr ? JSON.parse(prizesStr) : [];
    } catch {
      console.warn('Invalid JSON in Redis, using default prizes');
      prizes = [];
    }

    if (!Array.isArray(prizes) || prizes.length === 0) {
      prizes = [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prizes)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
