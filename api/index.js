// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import the main server configuration
import '../server/routes.js';
import { db } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS configuration for production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Vercel domains and configured frontend URL
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      /\.vercel\.app$/,
      /localhost:\d+$/
    ];
    
    if (!origin) return callback(null, true); // Allow non-browser requests
    
    const isAllowed = allowedOrigins.some(pattern => 
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for serverless environment
app.use(session({
  secret: process.env.SESSION_SECRET || (() => {
    console.warn('WARNING: Using default session secret. Set SESSION_SECRET environment variable.');
    return 'default-session-secret-change-in-production';
  })(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Import routes from server
import router from '../server/routes.js';
app.use('/', router);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Serverless function error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export for Vercel
export default app;