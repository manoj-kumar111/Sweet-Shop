import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { connectDB } from '../../config/db';
import User from '../auth/user.model';
import { generateToken } from '../../utils/jwt';

describe('Sweets Module', () => {
  let adminToken: string;
  let userToken: string;

  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    
    // Create Users for Auth
    await User.deleteMany({});
    
    const admin = await User.create({
      email: 'admin@sweetshop.com',
      password: 'password123',
      role: 'ADMIN'
    });
    adminToken = generateToken(admin._id as string, 'ADMIN');

    const user = await User.create({
      email: 'user@sweetshop.com',
      password: 'password123',
      role: 'USER'
    });
    userToken = generateToken(user._id as string, 'USER');
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (mongoose.connection.collections.sweets) {
      await mongoose.connection.collections.sweets.deleteMany({});
    }
    await mongoose.connection.close();
  });

  // Clean up sweets after each test to ensure isolation
  afterEach(async () => {
    if (mongoose.connection.collections.sweets) {
      await mongoose.connection.collections.sweets.deleteMany({});
    }
  });

  describe('POST /api/sweets', () => {
    it('should deny access if not authenticated', async () => {
      const res = await request(app).post('/api/sweets').send({});
      expect(res.status).toBe(401);
    });

    it('should deny access if user is not admin', async () => {
      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Lollipop',
          category: 'Hard Candy',
          price: 0.5,
          quantity: 100
        });
      expect(res.status).toBe(403);
    });

    it('should create a sweet if user is admin', async () => {
      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Bar',
          category: 'Chocolate',
          price: 2.5,
          quantity: 50
        });
      expect(res.status).toBe(201);
      expect(res.body.sweet).toHaveProperty('name', 'Chocolate Bar');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Sweet'
        });
      expect(res.status).toBe(400);
    });

    it('should validate non-negative price and quantity', async () => {
      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Negative Sweet',
          category: 'Test',
          price: -5,
          quantity: 10
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/sweets', () => {
    it('should list all sweets for authenticated users', async () => {
      const res = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/sweets/search', () => {
    it('should search sweets by name and price', async () => {
      // Create sweets for search
      const sweet1 = await request(app).post('/api/sweets').set('Authorization', `Bearer ${adminToken}`).send({ name: 'SearchTarget', category: 'Test', price: 10, quantity: 10 });
      expect(sweet1.status).toBe(201);

      const sweet2 = await request(app).post('/api/sweets').set('Authorization', `Bearer ${adminToken}`).send({ name: 'OtherSweet', category: 'Test', price: 20, quantity: 10 });
      expect(sweet2.status).toBe(201);

      // Verify sweets exist before search
      const allSweets = await request(app).get('/api/sweets').set('Authorization', `Bearer ${userToken}`);
      expect(allSweets.status).toBe(200);
      expect(allSweets.body.length).toBeGreaterThanOrEqual(2);

      const res = await request(app)
        .get('/api/sweets/search')
        .query({ name: 'Target', maxPrice: 15 })
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('SearchTarget');
      expect(res.body[0].price).toBe(10);
    });
  });

  describe('PUT /api/sweets/:id', () => {
    it('should update a sweet if admin', async () => {
      // Create a sweet first (using admin token)
      const createRes = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Update', category: 'Test', price: 1, quantity: 10 });
      expect(createRes.status).toBe(201);
      
      const sweetId = createRes.body.sweet._id;

      const res = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 2 });
      
      expect(res.status).toBe(200);
      expect(res.body.sweet.price).toBe(2);
    });
  });

  describe('DELETE /api/sweets/:id', () => {
    it('should delete a sweet if admin', async () => {
      const createRes = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Delete', category: 'Test', price: 1, quantity: 10 });
      expect(createRes.status).toBe(201);
      
      const sweetId = createRes.body.sweet._id;

      const res = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
    });
  });
});