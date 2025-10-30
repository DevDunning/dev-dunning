// dd-wheel/functions/get-rewards.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function handler() {
  try {
    const prizesStr = await redis.get('rewards:prizes');
    const prizes = prizesStr ? JSON.parse(prizesStr) : [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];
    return {
      statusCode: 200,
      body: JSON.stringify(prizes)
    };
  } catch (error) {
    console.error('Error fetching prizes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
