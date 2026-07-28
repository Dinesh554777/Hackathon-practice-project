const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/addresses
router.get('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(addresses);
});

// POST /api/addresses
router.post('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { label, street, city, state, zip, country, isDefault } = req.body;

  if (!street || !city || !state || !zip) {
    return res.status(400).json({ error: 'street, city, state, and zip are required' });
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const count = await prisma.address.count({ where: { userId: req.user.id } });

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      label: label || 'Home',
      street,
      city,
      state,
      zip,
      country: country || 'US',
      isDefault: isDefault || count === 0,
    },
  });

  res.status(201).json(address);
});

// DELETE /api/addresses/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const address = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!address || address.userId !== req.user.id) {
    return res.status(404).json({ error: 'Address not found' });
  }
  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ message: 'Address deleted' });
});

module.exports = router;
