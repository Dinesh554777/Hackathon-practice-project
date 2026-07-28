const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema, mfaVerifySchema } = require('../validators/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.isMfaEnabled) {
    return res.json({ mfaRequired: true, userId: user.id });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, isVerified: true, isMfaEnabled: true, createdAt: true },
  });
  res.json(user);
});

// GET /api/auth/mfa/setup - Generate MFA secret and QR code
router.get('/mfa/setup', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const secret = speakeasy.generateSecret({ name: 'AI-ECommerce' });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { mfaSecret: secret.base32 },
  });

  qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
    if (err) return res.status(500).json({ error: 'Failed to generate QR code' });
    res.json({ secret: secret.base32, qrCode: dataUrl });
  });
});

// POST /api/auth/mfa/verify - Verify and enable MFA
router.post('/mfa/verify', verifyToken, validate(mfaVerifySchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user.mfaSecret) {
    return res.status(400).json({ error: 'MFA not set up. Call /mfa/setup first' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: req.body.token,
  });

  if (!verified) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { isMfaEnabled: true },
  });

  res.json({ message: 'MFA enabled successfully' });
});

// POST /api/auth/mfa/login - MFA login step
router.post('/mfa/login', validate(mfaVerifySchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { userId, token } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isMfaEnabled || !user.mfaSecret) {
    return res.status(401).json({ error: 'MFA not configured for this user' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    return res.status(401).json({ error: 'Invalid MFA token' });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/mfa/disable
router.post('/mfa/disable', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  await prisma.user.update({
    where: { id: req.user.id },
    data: { isMfaEnabled: false, mfaSecret: null },
  });
  res.json({ message: 'MFA disabled successfully' });
});

module.exports = router;
