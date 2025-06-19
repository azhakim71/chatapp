import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:80", "http://127.0.0.1:80"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// Enhanced CORS middleware for XAMPP
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:80", "http://127.0.0.1:80"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import database manager
import { dbManager } from './config/database.js';

// Setup routes (available before database connection)
import setupRoutes from './routes/setup.js';
app.use('/api/setup', setupRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = dbManager.getConnectionStatus();
    
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      xampp: 'Ready for XAMPP deployment'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Conditional route loading (only after database is connected)
app.use('/api/*', (req, res, next) => {
  if (!dbManager.isConnected && !req.path.includes('/setup')) {
    return res.status(503).json({
      message: 'Database not connected. Please complete setup first.',
      setupRequired: true
    });
  }
  next();
});

// Dynamic route loading
let routesLoaded = false;

const loadRoutes = async () => {
  if (routesLoaded) return;
  
  try {
    const authRoutes = (await import('./routes/auth.js')).default;
    const userRoutes = (await import('./routes/users.js')).default;
    const chatRoutes = (await import('./routes/chats.js')).default;
    const adminRoutes = (await import('./routes/admin.js')).default;
    const { handleSocketConnection } = await import('./socket/handlers.js');

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/chats', chatRoutes);
    app.use('/api/admin', adminRoutes);

    // Socket.io connection handling
    io.on('connection', (socket) => {
      handleSocketConnection(socket, io);
    });

    routesLoaded = true;
    console.log('✅ Application routes loaded');
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
  }
};

// Load routes when database connects
const originalConnect = dbManager.connect.bind(dbManager);
dbManager.connect = async function(uri) {
  const result = await originalConnect(uri);
  if (result.success) {
    await loadRoutes();
  }
  return result;
};

// Environment variables with fallbacks
export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const PORT = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  try {
    if (dbManager.isConnected) {
      await dbManager.connection.close();
      console.log('📊 Database connection closed.');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.log('🔄 Shutting down the server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SecureChat Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: http://localhost:5173`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📊 XAMPP Compatible: Ready for deployment`);
  console.log(`⚙️  Setup URL: http://localhost:${PORT}/api/setup/status`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Open the application in your browser');
  console.log('2. Complete the database setup');
  console.log('3. Start chatting with the sample users!');
});