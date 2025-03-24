import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import { type Request, Response, NextFunction } from "express";
import { storage } from "../server/storage";
import session from "express-session";
import { setupAuth } from "../server/auth";

// Create Express application
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in development
}));

app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true,
}));

// Performance middleware
app.use(compression());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Set up authentication
setupAuth(app);

// Basic routes for API access
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'production',
    version: process.env.VERSION || '1.0.0',
  });
});

// Add API routes for user management
app.get('/api/users', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// This is needed for Vercel serverless functions
export default app;