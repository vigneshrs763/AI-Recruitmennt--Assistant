import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import * as cascadeflow from '@cascadeflow/core';

dotenv.config();

// Initialize cascadeflow
cascadeflow.init({
  mode: "observe",
});

const port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});