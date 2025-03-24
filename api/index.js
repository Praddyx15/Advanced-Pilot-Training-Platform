/**
 * API entry point for serverless function handling
 * This file serves as the main entry point for all API requests in the serverless environment
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cors = require('cors');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

// Initialize express app
const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'aptp-default-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 86400000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Authentication helpers
const scryptAsync = promisify(scrypt);
const sampleUsers = [
  {
    id: 1,
    username: 'instructor',
    // hashed version of 'password'
    password: '45255805f089632673b11e0c6ddcd80f9402e2de52c17a56c95bc8a45e36cb3be2c84819ca83cf49ae18a0c08d3bb6214db5d68b0125acfee896d0cb7f272b93.e7436df7bda05845a372ebb3d17cedeb',
    firstName: 'John',
    lastName: 'Smith',
    email: 'instructor@example.com',
    role: 'instructor',
    organizationType: 'ATO',
    organizationName: 'Flight School 1',
    mfaEnabled: false,
    profilePicture: null,
    lastLoginAt: null
  },
  {
    id: 2,
    username: 'trainee',
    // hashed version of 'password'
    password: '45255805f089632673b11e0c6ddcd80f9402e2de52c17a56c95bc8a45e36cb3be2c84819ca83cf49ae18a0c08d3bb6214db5d68b0125acfee896d0cb7f272b93.e7436df7bda05845a372ebb3d17cedeb',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'trainee@example.com',
    role: 'trainee',
    organizationType: 'ATO',
    organizationName: 'Flight School 1',
    mfaEnabled: false,
    profilePicture: null,
    lastLoginAt: null
  },
  {
    id: 3,
    username: 'admin',
    // hashed version of 'password'
    password: '45255805f089632673b11e0c6ddcd80f9402e2de52c17a56c95bc8a45e36cb3be2c84819ca83cf49ae18a0c08d3bb6214db5d68b0125acfee896d0cb7f272b93.e7436df7bda05845a372ebb3d17cedeb',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin',
    organizationType: 'ATO',
    organizationName: 'Flight School 1',
    mfaEnabled: false,
    profilePicture: null,
    lastLoginAt: null
  }
];

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = sampleUsers.find(u => u.username === username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: 'Invalid username or password' });
      } else {
        return done(null, user);
      }
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = sampleUsers.find(u => u.id === id);
  done(null, user || null);
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running properly' });
});

// Auth routes
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  // Update last login timestamp
  req.user.lastLoginAt = new Date();
  res.status(200).json(req.user);
});

app.post('/api/register', (req, res) => {
  // In a production environment, this would create a new user
  res.status(503).json({ message: 'Registration is temporarily unavailable in this deployment' });
});

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json(req.user);
});

// Training program related routes
app.get('/api/programs', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([
    {
      id: 1,
      name: 'Commercial Pilot License',
      status: 'active',
      programType: 'type_rating',
      aircraftType: 'B737',
      description: 'Complete Boeing 737 type rating program',
      regulatoryAuthority: 'FAA',
      createdAt: new Date(),
      updatedAt: new Date(),
      durationDays: 90,
      createdById: 1
    },
    {
      id: 2,
      name: 'Private Pilot License',
      status: 'active',
      programType: 'initial',
      aircraftType: 'C172',
      description: 'Private pilot certification program',
      regulatoryAuthority: 'EASA',
      createdAt: new Date(),
      updatedAt: new Date(),
      durationDays: 60,
      createdById: 1
    }
  ]);
});

// Add all other API routes
// These are placeholder routes for the deployment version
app.get('/api/modules', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([]);
});

app.get('/api/sessions', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([]);
});

app.get('/api/assessments', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([]);
});

app.get('/api/documents', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([]);
});

app.get('/api/resources', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([]);
});

app.get('/api/achievements', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  res.json([]);
});

// Catch-all handler for all other routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: 'The requested API endpoint does not exist or is not yet implemented in this deployment',
    status: 404
  });
});

// Export for serverless function handling
module.exports = (req, res) => {
  // Handle the request with the Express app
  return app(req, res);
};