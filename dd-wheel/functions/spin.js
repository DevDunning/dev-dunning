import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { wallet, spinCount } = JSON.parse(event.body);
    if (!wallet) throw new Error('Missing wallet');

    const today = new Date().toISOString().split('T')[0];

    // Fetch prizes safely
    let prizes = [];
    if (redis) {
      try {
        const prizesStr = await redis.get('rewards:prizes');
        prizes = prizesStr ? JSON.parse(prizesStr) : [];
      } catch {
        prizes = [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];
      }
    } else {
      prizes = [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];
    }

    // Pick a random prize
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[prizeIndex];

    // Log winner safely
    if (redis) {
      const winnersKey = `winners:${today}`;
      let currentWinners = [];
      try {
        const raw = await redis.get(winnersKey);
        currentWinners = raw ? JSON.parse(raw) : [];
      } catch {
        currentWinners = [];
      }
      currentWinners.push({ wallet, prize, spinCount, date: new Date().toISOString() });
      await redis.set(winnersKey, JSON.stringify(currentWinners));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prize, segment: prizeIndex })
    };
  } catch (err) {
    console.error('Spin error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
