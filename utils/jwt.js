const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (
    !secret ||
    secret === 'replace_with_a_long_random_secret' ||
    secret === 'your_long_random_secret_here' ||
    secret.length < 32
  ) {
    throw new Error(
      'JWT_SECRET is missing or too weak. Configure a strong secret in .env.'
    );
  }

  return secret;
}

function createToken(user) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role
    },
    getJwtSecret(),
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      algorithm: 'HS256'
    }
  );
}

module.exports = {
  getJwtSecret,
  createToken
};