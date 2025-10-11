// netlify/functions/roadmap-get.js
export const config = { runtime: "nodejs18.x" };

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async function(event, context) {
    try {
        let { data: phases, error } = await supabase
            .from('roadmap_phases')
            .select('id, title, description, progress')
            .order('id', { ascending: true });
        if (error) throw error;
        return {
            statusCode: 200,
            body: JSON.stringify(phases)
        };
    } catch (err) {
        console.error('Roadmap-get error', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not fetch roadmap' }) };
    }
};
