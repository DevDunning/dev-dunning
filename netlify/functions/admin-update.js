// netlify/functions/admin-update.js
export const config = { runtime: "nodejs18.x" };

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const token = (event.headers.authorization || '').split(' ')[1];
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Missing token' }) };
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Invalid token' }) };
    }
    const body = JSON.parse(event.body);
    const action = body.action;
    try {
        if (action === 'add_poll_choice') {
            const { text } = body;
            const { data, error } = await supabase.from('poll_choices').insert({ choice_text: text });
            if (error) throw error;
            // Log admin action
            await supabase.from('admin_logs').insert({ action: 'add_poll_choice', table_name: 'poll_choices', record_id: data[0].id, data: JSON.stringify({ text }) });
            return { statusCode: 200, body: 'Poll choice added' };
        }
        if (action === 'add_news') {
            const { title, body: newsBody, link } = body;
            const sanitized = sanitizeHtml(newsBody);
            const { data, error } = await supabase.from('news').insert({ title, body: sanitized, link });
            if (error) throw error;
            await supabase.from('admin_logs').insert({ action: 'add_news', table_name: 'news', record_id: data[0].id, data: JSON.stringify({ title, link }) });
            return { statusCode: 200, body: 'News added' };
        }
        if (action === 'delete_news') {
            const { id } = body;
            const { error } = await supabase.from('news').delete().eq('id', id);
            if (error) throw error;
            await supabase.from('admin_logs').insert({ action: 'delete_news', table_name: 'news', record_id: id, data: JSON.stringify({}) });
            return { statusCode: 200, body: 'News deleted' };
        }
        if (action === 'update_roadmap') {
            const { phases } = body;
            for (const phase of phases) {
                await supabase.from('roadmap_phases').update({
                    progress: phase.progress,
                    description: phase.description
                }).eq('id', phase.id);
                await supabase.from('admin_logs').insert({ action: 'update_roadmap', table_name: 'roadmap_phases', record_id: phase.id, data: JSON.stringify({ progress: phase.progress }) });
            }
            return { statusCode: 200, body: 'Roadmap updated' };
        }
        return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };
    } catch (err) {
        console.error('Admin-update error', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Admin update failed' }) };
    }
};
