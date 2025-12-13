import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sweetshop',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  env: process.env.NODE_ENV || 'development',
};