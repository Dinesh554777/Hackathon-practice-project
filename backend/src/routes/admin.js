const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require ADMIN role
router.use(verifyToken, requireRole('ADMIN'));

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const prisma = req.app.get('prisma');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isMfaEnabled: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const prisma = req.app.get('prisma');
  const [productCount, orderCount, userCount, revenue] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'COMPLETED' } }),
  ]);

  res.json({
    products: productCount,
    orders: orderCount,
    users: userCount,
    revenue: revenue._sum.total || 0,
  });
});

module.exports = router;
