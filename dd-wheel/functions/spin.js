import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { wallet, spinCount } = JSON.parse(event.body);
  if (!wallet) return { statusCode: 400, body: 'Missing wallet' };

  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const prizesStr = redis ? await redis.get('rewards:prizes') : null;
    const prizes = prizesStr ? JSON.parse(prizesStr) : [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];

    if (redis) {
      const key = `spins:${wallet}:${today}`;
      await redis.incr(key);
    }

    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[prizeIndex];

    if (prize > 0 && redis) {
      const winnersKey = `winners:${today}`;
      const currentWinners = await redis.get(winnersKey) || '[]';
      const winners = JSON.parse(currentWinners);
      winners.push({ wallet, date: now, prize, spinCount });
      await redis.set(winnersKey, JSON.stringify(winners));
    }

    return { statusCode: 200, body: JSON.stringify({ prize, segment: prizeIndex }) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
