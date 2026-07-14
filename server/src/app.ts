import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import taskRoutes from './routes/taskRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

// Middleware configuration
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Global Error Handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

export default app;
