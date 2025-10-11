const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const token = event.headers.authorization?.replace('Bearer ', '');
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { type, data } = JSON.parse(event.body);
  let error;
  let logAction;
  if (type === 'news') {
    const sanitized = {
      title: data.title,
      body: sanitizeHtml(data.body, { allowedTags: ['b', 'i', 'a'], allowedAttributes: { a: ['href'] } }),
      link: data.link || null
    };
    if (data.id) {
      ({ error } = await supabase.from('news').update(sanitized).eq('id', data.id));
      logAction = 'update_news';
    } else {
      const { data: newData } = await supabase.from('news').insert(sanitized).select('id');
      logAction = 'add_news';
      data.id = newData[0].id;
    }
  } else if (type === 'delete_news') {
    ({ error } = await supabase.from('news').delete().eq('id', data.id));
    logAction = 'delete_news';
  } else if (type === 'poll') {
    if (data.id) {
      ({ error } = await supabase.from('poll_options').update({ text: data.text }).eq('id', data.id));
      logAction = 'update_poll';
    } else {
      const { data: newData } = await supabase.from('poll_options').insert({ text: data.text }).select('id');
      logAction = 'add_poll';
      data.id = newData[0].id;
    }
  } else if (type === 'delete_poll') {
    ({ error } = await supabase.from('poll_options').delete().eq('id', data.id));
    logAction = 'delete_poll';
  } else if (type === 'roadmap') {
    ({ error } = await supabase.from('roadmap_phases').update(data).eq('id', data.id));
    logAction = 'update_roadmap';
  }
  if (error) return { statusCode: 500, body: 'Error' };
  await supabase.from('admin_logs').insert({ action: logAction, details: data });
  return { statusCode: 200, body: 'OK' };
};