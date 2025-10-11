// netlify/functions/news-get.js
export const config = { runtime: "nodejs18.x" };

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async function(event, context) {
    try {
        let { data: news, error } = await supabase
            .from('news')
            .select('id, title, body, link, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return {
            statusCode: 200,
            body: JSON.stringify(news)
        };
    } catch (err) {
        console.error('News-get error', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not fetch news' }) };
    }
};
