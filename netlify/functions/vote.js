const fetch = require('node-fetch');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { option_id, fingerprint, recaptchaToken } = JSON.parse(event.body);
  const userAgent = event.headers['user-agent'];
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const salt = process.env.SECRET_SALT;
  const ipHash = crypto.createHmac('sha256', salt).update(ip + userAgent).digest('hex');

  if (process.env.RECAPTCHA_SECRET && recaptchaToken) {
    const recRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`, { method: 'POST' });
    const recData = await recRes.json();
    if (!recData.success || recData.score < 0.5) return { statusCode: 403, body: 'Captcha failed' };
  }

  const { data: existing } = await supabase.from('votes').select('id').eq('fingerprint_hash', fingerprint).limit(1);
  if (existing.length) return { statusCode: 403, body: 'Already voted' };

  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('ip_hash', ipHash).gt('created_at', hourAgo);
  if (count >= 10) return { statusCode: 429, body: 'Rate limit exceeded' };

  const { error } = await supabase.from('votes').insert({ option_id, fingerprint_hash: fingerprint, ip_hash: ipHash });
  if (error) return { statusCode: 500, body: 'Error' };

  await supabase.from('poll_options').update({ votes: supabase.raw('votes + 1') }).eq('id', option_id);

  return { statusCode: 200, body: 'OK' };
};