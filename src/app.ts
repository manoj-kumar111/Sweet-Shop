import express, { Application, Request, Response } from 'express';
import authRoutes from './modules/auth/auth.routes';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(cors());

// Health Check Route (Proof of Life)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

export default app;