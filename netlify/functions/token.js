const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const mint = process.env.TOKEN_ADDRESS;
    const chain = process.env.CHAIN;
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    if (!response.ok) throw new Error('API error');
    const { pairs } = await response.json();
    if (!pairs.length) throw new Error('No pairs');
    const pair = pairs.find(p => p.chainId === chain) || pairs[0];
    const price = parseFloat(pair.priceUsd) || 0;
    const data = {
      price,
      marketCap: pair.fdv || (price * 1000000000),
      totalSupply: 1000000000, // Pump.fun standard
      holders: null, // Not available
      recentTrades: pair.txns?.h24?.buys + pair.txns?.h24?.sells || 0
    };
    await supabase.from('token_cache').update({ data, updated_at: new Date().toISOString() }).eq('id', 1);
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (e) {
    const { data: cache } = await supabase.from('token_cache').select('data').eq('id', 1).single();
    return { statusCode: 200, body: JSON.stringify(cache?.data || {}) };
  }
};