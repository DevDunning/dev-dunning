// netlify/functions/vote.js
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const { fingerprint, choice_id, recaptchaToken } = JSON.parse(event.body);
    try {
        // Recaptcha validation if enabled
        if (process.env.RECAPTCHA_SECRET) {
            if (!recaptchaToken) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Recaptcha token missing' }) };
            }
            const params = new URLSearchParams();
            params.append('secret', process.env.RECAPTCHA_SECRET);
            params.append('response', recaptchaToken);
            const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST', body: params
            });
            const recaptchaData = await recaptchaRes.json();
            if (!recaptchaData.success || recaptchaData.score < 0.5) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Recaptcha failed' }) };
            }
        }
        // Compute IP hash
        const ip = event.headers['x-forwarded-for'] || event.headers['x-nf-client-connection-ip'] || (context.identity && context.identity.sourceIp);
        const ua = event.headers['user-agent'] || '';
        const salt = process.env.SECRET_SALT || '';
        const ipHash = crypto.createHash('sha256').update(ip + ua + salt).digest('hex');
        // Check fingerprint uniqueness
        let { data: existing } = await supabase.from('poll_votes').select('id').eq('fingerprint', fingerprint).single();
        if (existing) {
            return { statusCode: 429, body: JSON.stringify({ error: 'Already voted' }) };
        }
        // Check rate limit for IP (max 10 per hour)
        const oneHourAgo = new Date(Date.now() - 60*60*1000).toISOString();
        let { count } = await supabase.from('poll_votes').select('*', { count: 'exact', head: true }).gte('created_at', oneHourAgo).eq('ip_hash', ipHash);
        if (count >= 10) {
            return { statusCode: 429, body: JSON.stringify({ error: 'Rate limit exceeded' }) };
        }
        // Insert vote
        const { error } = await supabase.from('poll_votes').insert({
            choice_id: choice_id, fingerprint: fingerprint, ip_hash: ipHash
        });
        if (error) throw error;
        // Fetch updated results
        const { data: choices } = await supabase.from('poll_choices').select('id, choice_text');
        let totalVotes = 0;
        const results = [];
        for (const choice of choices) {
            let { count } = await supabase.from('poll_votes').select('*', { count: 'exact', head: true }).eq('choice_id', choice.id);
            const votes = count || 0;
            results.push({ id: choice.id, choice_text: choice.choice_text, votes });
            totalVotes += votes;
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ choices: results, total: totalVotes })
        };
    } catch (err) {
        console.error('Vote error', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Vote failed' }) };
    }
};
