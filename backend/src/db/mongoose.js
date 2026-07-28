const mongoose = require('mongoose');

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = { connectMongo, mongoose };
