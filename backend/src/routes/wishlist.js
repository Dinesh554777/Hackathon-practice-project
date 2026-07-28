const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/wishlist
router.get('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        select: { id: true, name: true, slug: true, price: true, image: true, stock: true, rating: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

// POST /api/wishlist
router.post('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId } },
  });

  if (existing) {
    return res.status(409).json({ error: 'Product already in wishlist' });
  }

  const item = await prisma.wishlistItem.create({
    data: { userId: req.user.id, productId },
    include: {
      product: { select: { id: true, name: true, slug: true, price: true, image: true } },
    },
  });

  res.status(201).json(item);
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
  });

  if (!item) return res.status(404).json({ error: 'Wishlist item not found' });

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
