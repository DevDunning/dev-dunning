const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const { password } = JSON.parse(event.body);
  if (!bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH)) {
    return { statusCode: 401, body: 'Invalid password' };
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { statusCode: 200, body: JSON.stringify({ token }) };
};