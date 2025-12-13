import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { connectDB } from '../../config/db';

describe('Auth Module', () => {
  // Increase timeout to 30s to handle DB connection latency
  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Clean up the database after each test to ensure isolation
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with role USER', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'user@test.com',
        password: 'password123',
      });
      
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('email', 'user@test.com');
      expect(res.body.user).toHaveProperty('role', 'USER');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 400 if email is already registered', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: '123',
      });
      
      const res = await request(app).post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: '456',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register-admin', () => {
    it('should register a new admin with role ADMIN', async () => {
      const res = await request(app).post('/api/auth/register-admin').send({
        email: 'admin@test.com',
        password: 'adminPassword',
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('role', 'ADMIN');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return a JWT token for valid credentials', async () => {
      // Create user first
      await request(app).post('/api/auth/register').send({
        email: 'login@test.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'wrong@test.com',
        password: 'wrong',
      });

      expect(res.status).toBe(401);
    });
  });
});