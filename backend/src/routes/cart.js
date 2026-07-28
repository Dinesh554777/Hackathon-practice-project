const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart
router.get('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true, price: true, image: true, stock: true } } },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id },
      include: { items: true },
    });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  res.json({ ...cart, subtotal, itemCount: cart.items.length });
});

// POST /api/cart/items
router.post('/items', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { productId, quantity = 1 } = req.body;

  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user.id } });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) return res.status(400).json({ error: 'Insufficient stock' });

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true, price: true, image: true, stock: true } } },
      },
    },
  });

  res.json(updated);
});

// PUT /api/cart/items/:id
router.put('/items/:id', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { quantity } = req.body;

  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

  const item = await prisma.cartItem.findUnique({
    where: { id: req.params.id },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== req.user.id) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  if (quantity > item.product.stock) return res.status(400).json({ error: 'Insufficient stock' });

  await prisma.cartItem.update({
    where: { id: req.params.id },
    data: { quantity },
  });

  const updated = await prisma.cart.findUnique({
    where: { id: item.cartId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true, price: true, image: true, stock: true } } },
      },
    },
  });

  res.json(updated);
});

// DELETE /api/cart/items/:id
router.delete('/items/:id', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');

  const item = await prisma.cartItem.findUnique({
    where: { id: req.params.id },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== req.user.id) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  await prisma.cartItem.delete({ where: { id: req.params.id } });

  const updated = await prisma.cart.findUnique({
    where: { id: item.cartId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true, price: true, image: true, stock: true } } },
      },
    },
  });

  res.json(updated);
});

// DELETE /api/cart
router.delete('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
