require('dotenv').config();

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
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'airbnb.session'
  },
  
  // CORS configuration
  cors: (() => {
    // Support multiple frontend origins via comma-separated env FRONTEND_URLS
    const whitelist = (process.env.FRONTEND_URLS || 'http://localhost:3000,http://localhost:3002')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    return {
      origin: (origin, callback) => {
        // Allow non-browser or same-origin requests without an Origin header
        if (!origin) return callback(null, true);
        if (whitelist.includes(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
      optionsSuccessStatus: 204,
      preflightContinue: false,
    };
  })(),
  
  // File upload configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

module.exports = config;
