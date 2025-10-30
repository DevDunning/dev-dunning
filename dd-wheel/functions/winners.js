import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function handler() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const winnersKey = `winners:${today}`;
    const winnersStr = redis ? await redis.get(winnersKey) : '[]';
    const logs = JSON.parse(winnersStr || '[]');

    return { statusCode: 200, body: JSON.stringify(logs) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
