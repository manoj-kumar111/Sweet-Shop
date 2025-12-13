import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

// Connect to Database then start server
connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`Server running in ${config.env} mode on port ${config.port}`);
  });
});