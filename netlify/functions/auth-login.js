// netlify/functions/auth-login.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const { password } = JSON.parse(event.body);
    const adminHash = process.env.ADMIN_PASSWORD_HASH;
    if (!password || !adminHash) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
    }
    if (!bcrypt.compareSync(password, adminHash)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    // Create JWT
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return {
        statusCode: 200,
        body: JSON.stringify({ token })
    };
};
