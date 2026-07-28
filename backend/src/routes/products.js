const express = require('express');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createProductSchema } = require('../validators/product');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  const prisma = req.app.get('prisma');
  const {
    page = '1',
    limit = '20',
    search,
    category,
    minPrice,
    maxPrice,
    sort = 'createdAt',
    order = 'desc',
    featured,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (featured === 'true') {
    where.isFeatured = true;
  }

  const validSortFields = ['price', 'name', 'createdAt', 'rating', 'reviewCount'];
  const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortField]: sortOrder },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  const prisma = req.app.get('prisma');
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    orderBy: { rating: 'desc' },
  });
  res.json(products);
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const prisma = req.app.get('prisma');
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products (admin)
router.post('/', verifyToken, requireRole('ADMIN'), validate(createProductSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, description, price, compareAt, cost, stock, sku, image, images, categoryId, tags, isFeatured } = req.body;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  const product = await prisma.product.create({
    data: {
      name, slug, description, price: parseFloat(price),
      compareAt: compareAt ? parseFloat(compareAt) : null,
      cost: cost ? parseFloat(cost) : null,
      stock: parseInt(stock), sku, image, images: images || [],
      categoryId, tags: tags || [], isFeatured: isFeatured || false,
    },
  });
  res.status(201).json(product);
});

// PUT /api/products/:id (admin)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, description, price, compareAt, cost, stock, sku, image, images, categoryId, tags, isFeatured, isActive } = req.body;

  const data = {};
  if (name) { data.name = name; data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now(); }
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = parseFloat(price);
  if (compareAt !== undefined) data.compareAt = parseFloat(compareAt);
  if (cost !== undefined) data.cost = parseFloat(cost);
  if (stock !== undefined) data.stock = parseInt(stock);
  if (sku !== undefined) data.sku = sku;
  if (image !== undefined) data.image = image;
  if (images !== undefined) data.images = images;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (tags !== undefined) data.tags = tags;
  if (isFeatured !== undefined) data.isFeatured = isFeatured;
  if (isActive !== undefined) data.isActive = isActive;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
  });
  res.json(product);
});

// DELETE /api/products/:id (admin)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.get('prisma');
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product deleted' });
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', verifyToken, async (req, res) => {
  const prisma = req.app.get('prisma');
  const { rating, title, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: req.user.id, productId: req.params.id } },
  });
  if (existing) return res.status(409).json({ error: 'You already reviewed this product' });

  const review = await prisma.review.create({
    data: { userId: req.user.id, productId: req.params.id, rating: parseInt(rating), title, comment },
  });

  const stats = await prisma.review.aggregate({
    where: { productId: req.params.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: req.params.id },
    data: { rating: stats._avg.rating || 0, reviewCount: stats._count.rating },
  });

  res.status(201).json(review);
});

module.exports = router;
