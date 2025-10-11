// netlify/functions/token.js
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function(event, context) {
    const chain = process.env.CHAIN || 'solana';
    const address = process.env.TOKEN_ADDRESS;
    try {
        // Check cache
        let { data: cacheData, error } = await supabase
            .from('token_cache')
            .select('*')
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Supabase error fetching token_cache', error);
        }
        const now = new Date();
        if (cacheData) {
            const updated = new Date(cacheData.updated_at);
            const diff = (now - updated) / 1000;
            if (diff < 30) {
                // Return cached data
                return {
                    statusCode: 200,
                    body: JSON.stringify(cacheData)
                };
            }
        }

        // Fetch from API (DexScreener)
        let price = cacheData ? cacheData.price : '$0';
        let marketCap = cacheData ? cacheData.market_cap : '$0';
        let totalSupply = cacheData ? cacheData.total_supply : '0';
        let holders = cacheData ? cacheData.holders : 0;
        let trades = cacheData ? cacheData.trades : 0;
        try {
            const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/${chain}/${address}`);
            const dexData = await res.json();
            if (dexData && dexData.length > 0) {
                const pair = dexData[0];
                price = '$' + parseFloat(pair.priceUsd).toFixed(2);
                marketCap = '$' + parseFloat(pair.marketCap).toLocaleString();
                // Compute trades from txns
                let txns = pair.txns || {};
                let tradesCount = 0;
                for (const key in txns) {
                    tradesCount += (txns[key].buys || 0) + (txns[key].sells || 0);
                }
                trades = tradesCount;
                // Keep existing totalSupply and holders (not fetched)
            }
        } catch (err) {
            console.error('DexScreener fetch error', err);
        }

        // Update cache
        const newData = {
            price: price,
            market_cap: marketCap,
            total_supply: totalSupply,
            holders: holders,
            trades: trades
        };
        await supabase.from('token_cache').upsert({ id: 1, ...newData }, { onConflict: 'id' });

        return {
            statusCode: 200,
            body: JSON.stringify(newData)
        };
    } catch (err) {
        console.error('Error in token function', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
