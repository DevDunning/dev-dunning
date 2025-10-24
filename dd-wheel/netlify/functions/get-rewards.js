const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

exports.handler = async () => {
  try {
    const prizesStr = await redis.get('rewards:prizes');
    const prizes = prizesStr ? JSON.parse(prizesStr) : [10000, 20000, 50000, 100000, 5000, 25000, 75000, 0];
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
};