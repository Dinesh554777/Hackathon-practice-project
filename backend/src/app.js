require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { connectMongo } = require('./db/mongoose');
const redis = require('./db/redis');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');

app.set('prisma', prisma);
app.set('redis', redis);

app.use('/api/auth', authRoutes);

app.get('/api/health', async (req, res) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'error');
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

module.exports = { app, prisma };
