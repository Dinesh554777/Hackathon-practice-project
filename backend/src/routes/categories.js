const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { categorySchema } = require('../validators/product');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  const prisma = req.app.get('prisma');
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  const prisma = req.app.get('prisma');
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      children: true,
      products: { where: { isActive: true }, take: 20, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

// POST /api/categories (admin)
router.post('/', verifyToken, requireRole('ADMIN'), validate(categorySchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, description, image, parentId } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ error: 'Category already exists' });

  const category = await prisma.category.create({
    data: { name, slug, description, image, parentId },
  });
  res.status(201).json(category);
});

// PUT /api/categories/:id (admin)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, description, image, parentId, isActive } = req.body;
  const data = {};
  if (name) {
    data.name = name;
    data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (description !== undefined) data.description = description;
  if (image !== undefined) data.image = image;
  if (parentId !== undefined) data.parentId = parentId;

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data,
  });
  res.json(category);
});

// DELETE /api/categories/:id (admin)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.get('prisma');
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
});

module.exports = router;
