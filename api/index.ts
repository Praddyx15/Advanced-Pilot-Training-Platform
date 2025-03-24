// Type declaration for missing modules
declare module 'compression';
declare module 'cors';
declare module 'memorystore';

import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { MemStorage } from "./storage";
import session from "express-session";
import * as memorystore from "memorystore";

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

// Set up simple session
const MemoryStore = memorystore.default(session);
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

// Type safety addition for session
declare module 'express-session' {
  interface SessionData {
    user: any;
  }
}

// Basic auth routes for API access
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (user) {
      // In production, you would verify the password hash here
      req.session.user = user;
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
  if (req.session.user) {
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
  if (req.session.user) {
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

// Get users by role
app.get('/api/users/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const users = await storage.getUsersByRole(role);
    res.json(users);
  } catch (error) {
    console.error(`Error fetching ${req.params.role} users:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Theme settings
app.post('/api/update-theme', (req, res) => {
  // Theme is stored client-side, so we just return success
  res.status(200).json({ success: true });
});

// Fallback endpoint for training program data
app.get('/api/training-programs', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'B737 Type Rating',
      programType: 'type_rating',
      status: 'active',
      aircraftType: 'B737-800',
      description: 'Complete type rating program for the Boeing 737-800 aircraft',
      regulatoryAuthority: 'EASA',
      durationDays: 45,
      createdById: 1
    },
    {
      id: 2,
      name: 'A320 Type Rating',
      programType: 'type_rating',
      status: 'active',
      aircraftType: 'A320',
      description: 'Complete type rating program for the Airbus A320 aircraft',
      regulatoryAuthority: 'EASA',
      durationDays: 42,
      createdById: 1
    }
  ]);
});

// Fallback endpoint for modules
app.get('/api/modules', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Aircraft Systems',
      programId: 1,
      description: 'Introduction to key aircraft systems',
      type: 'ground',
      durationHours: 40
    },
    {
      id: 2,
      name: 'Standard Operating Procedures',
      programId: 1,
      description: 'Standard procedures for normal operations',
      type: 'ground',
      durationHours: 24
    },
    {
      id: 3,
      name: 'Simulator Training Phase 1',
      programId: 1,
      description: 'Initial simulator training sessions',
      type: 'simulator',
      durationHours: 16
    }
  ]);
});

// Fallback endpoint for sessions
app.get('/api/sessions', (req, res) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  res.json([
    {
      id: 1,
      status: 'scheduled',
      programId: 1,
      moduleId: 3,
      startTime: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
      endTime: new Date(today.setHours(13, 0, 0, 0)).toISOString(),
      instructorId: 2,
      title: 'Simulator Session 1: Normal Procedures',
      location: 'Simulator Bay 3',
      resourceId: 5
    },
    {
      id: 2,
      status: 'scheduled',
      programId: 1,
      moduleId: 3,
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
      endTime: new Date(tomorrow.setHours(18, 0, 0, 0)).toISOString(),
      instructorId: 2,
      title: 'Simulator Session 2: Abnormal Procedures',
      location: 'Simulator Bay 2',
      resourceId: 6
    }
  ]);
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