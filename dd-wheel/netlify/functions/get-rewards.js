require('dotenv').config(); // Load environment variables
const { Redis } = require('@upstash/redis');

// Complete the Redis instantiation
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL, // From Upstash dashboard
  token: process.env.UPSTASH_REDIS_REST_TOKEN // From Upstash dashboard
});