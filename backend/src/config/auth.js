module.exports = {
  jwt: {
    accessSecret: process.env.JWT_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  mfa: {
    issuer: 'AI-ECommerce',
  },
};
