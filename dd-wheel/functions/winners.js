// dd-wheel/functions/winners.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function handler() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const winnersKey = `winners:${today}`;
    const winnersStr = await redis.get(winnersKey) || '[]';
    const logs = JSON.parse(winnersStr);
    return { statusCode: 200, body: JSON.stringify(logs) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}
