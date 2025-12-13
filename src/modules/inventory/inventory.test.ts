import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { connectDB } from '../../config/db';
import User from '../auth/user.model';
import Sweet from '../sweets/sweet.model';
import { generateToken } from '../../utils/jwt';

describe('Inventory Module', () => {
  let adminToken: string;
  let userToken: string;

  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    
    // Clean up and create users
    await User.deleteMany({});
    
    const admin = await User.create({
      email: 'admin@inventory.com',
      password: 'password123',
      role: 'ADMIN'
    });
    adminToken = generateToken(admin._id as string, 'ADMIN');

    const user = await User.create({
      email: 'user@inventory.com',
      password: 'password123',
      role: 'USER'
    });
    userToken = generateToken(user._id as string, 'USER');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Sweet.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Sweet.deleteMany({});
  });

  describe('POST /api/sweets/:id/purchase', () => {
    it('should reduce quantity by 1 on purchase', async () => {
      const sweet = await Sweet.create({
        name: 'Purchase Test',
        category: 'Test',
        price: 10,
        quantity: 5
      });

      const res = await request(app)
        .post(`/api/sweets/${sweet._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Purchase successful');
      
      const updatedSweet = await Sweet.findById(sweet._id);
      expect(updatedSweet?.quantity).toBe(4);
    });

    it('should return 400 if quantity is 0', async () => {
      const sweet = await Sweet.create({
        name: 'Out of Stock',
        category: 'Test',
        price: 10,
        quantity: 0
      });

      const res = await request(app)
        .post(`/api/sweets/${sweet._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Out of stock');
    });
  });

  describe('POST /api/sweets/:id/restock', () => {
    it('should increase quantity if admin', async () => {
      const sweet = await Sweet.create({
        name: 'Restock Test',
        category: 'Test',
        price: 10,
        quantity: 5
      });

      const res = await request(app)
        .post(`/api/sweets/${sweet._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(200);
      
      const updatedSweet = await Sweet.findById(sweet._id);
      expect(updatedSweet?.quantity).toBe(15);
    });

    it('should deny access if not admin', async () => {
      const sweet = await Sweet.create({
        name: 'Restock Deny',
        category: 'Test',
        price: 10,
        quantity: 5
      });

      const res = await request(app)
        .post(`/api/sweets/${sweet._id}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(403);
    });
  });
});