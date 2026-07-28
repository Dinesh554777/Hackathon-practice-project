const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@ecommerce.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('Seed data already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electronics', slug: 'electronics' } }),
    prisma.category.create({ data: { name: 'Clothing', slug: 'clothing' } }),
    prisma.category.create({ data: { name: 'Books', slug: 'books' } }),
    prisma.category.create({ data: { name: 'Home & Garden', slug: 'home-garden' } }),
  ]);

  await Promise.all([
    prisma.product.create({
      data: {
        name: 'Smartphone Pro',
        slug: 'smartphone-pro',
        price: 999.99,
        stock: 50,
        categoryId: categories[0].id,
        isFeatured: true,
        rating: 4.5,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        price: 199.99,
        stock: 100,
        categoryId: categories[0].id,
        isFeatured: true,
        rating: 4.3,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cotton T-Shirt',
        slug: 'cotton-tshirt',
        price: 29.99,
        stock: 200,
        categoryId: categories[1].id,
        rating: 4.0,
      },
    }),
  ]);

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
