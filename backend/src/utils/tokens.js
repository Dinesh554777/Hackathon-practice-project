const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    authConfig.jwt.accessSecret,
    { expiresIn: authConfig.jwt.accessExpiry },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    authConfig.jwt.refreshSecret,
    { expiresIn: authConfig.jwt.refreshExpiry },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, authConfig.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, authConfig.jwt.refreshSecret);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
