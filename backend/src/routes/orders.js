const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper to generate order number
function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

// POST /api/orders/checkout — create order from cart
router.post('/checkout', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { shippingAddressId, paymentMethod = 'card' } = req.body;

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Validate stock and calculate totals
  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return res.status(400).json({
        error: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
      });
    }
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      shippingAddressId: shippingAddressId || null,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
      },
    },
    include: { items: true },
  });

  // Decrement stock
  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  res.status(201).json(order);
});

// GET /api/orders
router.get('/', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { page = '1', limit = '10' } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where = { userId: req.user.id };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { items: true, _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/orders/:id
router.get('/:id', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(order);
});

// PATCH /api/orders/:id/status (admin)
router.patch('/:id/status', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { status, paymentStatus } = req.body;

  const data = {};
  if (status) data.status = status;
  if (paymentStatus) data.paymentStatus = paymentStatus;

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data,
    include: { items: true },
  });

  res.json(order);
});

// GET /api/orders/admin/all (admin)
router.get('/admin/all', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { page = '1', limit = '20', status } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const where = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

module.exports = router;
