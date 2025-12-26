import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const siteUrl = process.env.SITE_URL;

if (!redisUrl || !redisToken) {
  console.error('Missing Redis environment variables.');
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

export async function handler(event) {
  const today = new Date().toISOString().split('T')[0];

  // ✅ Resolve correct base URL (local vs production)
  const baseUrl =
    process.env.NETLIFY_DEV === 'true'
      ? `http://${event.headers.host}`
      : siteUrl;

  try {
    // 1️⃣ Fetch top holders
    let topHolders = [];

    try {
      const res = await fetch(
        `${baseUrl}/.netlify/functions/top-holders`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      topHolders = await res.json();

      if (!Array.isArray(topHolders)) {
        throw new Error('Invalid top-holders response');
      }
    } catch (err) {
      console.error('Failed to fetch top holders:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch top holders',
          details: err.message,
        }),
      };
    }

    if (topHolders.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'No top holders today',
          winner: null,
        }),
      };
    }

    // 2️⃣ Check if winner already exists for today
    const existingWinner = await redis.get(`daily-winner:${today}`);

    if (existingWinner) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: existingWinner,
      };
    }

    // 3️⃣ Pick random winner
    const winner =
      topHolders[Math.floor(Math.random() * topHolders.length)];

    // 4️⃣ Store winner in Redis
    await redis.set(
      `daily-winner:${today}`,
      JSON.stringify(winner)
    );

    // 5️⃣ Return winner
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(winner),
    };
  } catch (err) {
    console.error('Unexpected error in daily-spin:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Unexpected error',
        details: err.message,
      }),
    };
  }
}
