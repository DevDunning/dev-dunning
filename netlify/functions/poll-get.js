// netlify/functions/poll-get.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async function(event, context) {
    try {
        const question = process.env.POLL_QUESTION || 'Do you like this token?';
        // Fetch choices
        let { data: choices, error } = await supabase.from('poll_choices').select('id, choice_text');
        if (error) throw error;
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
            body: JSON.stringify({ question, choices: results, total: totalVotes })
        };
    } catch (err) {
        console.error('Poll-get error', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not fetch poll data' }) };
    }
};
