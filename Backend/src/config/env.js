require('dotenv').config();

// Build a robust list of local dev origins for CORS
const defaultOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://127.0.0.1',
  'http://127.0.0.1:80',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002'
]
const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]))

const config = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Lionel@2',
    database: process.env.DB_NAME || 'airbnb_db',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false, // Changed to false to work with HTTP in Docker
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'airbnb.session'
  },
  
  // CORS configuration
  cors: {
    origin: function(origin, callback) {
      // Allow REST tools or same-origin server requests (no origin)
      if (!origin) return callback(null, true)
      // Allow common localhost patterns on any port for dev
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
      if (isLocalhost) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      // In development, be more permissive to reduce flakiness with port changes
      if ((process.env.NODE_ENV || 'development') !== 'production') return callback(null, true)
      return callback(new Error(`Not allowed by CORS: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 999999 // effectively unlimited in dev
  }
};

module.exports = config;
