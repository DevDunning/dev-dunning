import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function handler() {
  try {
    const prizesStr = redis ? await redis.get('rewards:prizes') : null;
    const prizes = prizesStr ? JSON.parse(prizesStr) : [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];

    return {
      statusCode: 200,
      body: JSON.stringify(prizes)
    };
  } catch (err) {
    console.error('Redis error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
