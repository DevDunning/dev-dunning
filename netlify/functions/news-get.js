const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
  return { statusCode: 200, body: JSON.stringify(data) };
};