// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { createServer } = require('http');

const app = express();

// Middleware configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-domain.vercel.app'
    : ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for serverless
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder for routes - will be replaced with actual server routes
app.get('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.post('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Export for Vercel
module.exports = app;