// Type declaration for missing modules
declare module 'compression';
declare module 'cors';

import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { MemStorage } from "./storage";
import session from "express-session";

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

// Create a session store in memory
const MemoryStore = require('memorystore')(session);

// Set up simple session
app.use(session({
  secret: process.env.SESSION_SECRET || 'pilot-training-platform-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

// Create memory storage instance
const storage = new MemStorage();

// Basic auth routes for API access
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (user) {
      // In production, you would verify the password hash here
      if (req.session) {
        req.session.user = user;
      }
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Logout failed' });
      } else {
        res.status(200).json({ message: 'Logged out successfully' });
      }
    });
  } else {
    res.status(200).json({ message: 'No active session' });
  }
});

app.get('/api/user', (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configuration route
app.get('/api/config', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'production',
    version: process.env.VERSION || '1.0.0',
  });
});

// Get all users
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