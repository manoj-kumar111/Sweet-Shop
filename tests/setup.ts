import mongoose from 'mongoose';

// Runs after all tests are done to prevent open handles
afterAll(async () => {
  await mongoose.connection.close();
});