import express from 'express';
import { dbManager } from '../config/database.js';

const router = express.Router();

// Test database connection
router.post('/test-connection', async (req, res) => {
  try {
    const { mongoUri } = req.body;

    if (!mongoUri) {
      return res.status(400).json({
        success: false,
        message: 'MongoDB URI is required'
      });
    }

    const result = await dbManager.testConnection(mongoUri);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

// Connect to database
router.post('/connect', async (req, res) => {
  try {
    const { mongoUri } = req.body;

    if (!mongoUri) {
      return res.status(400).json({
        success: false,
        message: 'MongoDB URI is required'
      });
    }

    const result = await dbManager.connect(mongoUri);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Initialize database with sample data
router.post('/initialize', async (req, res) => {
  try {
    const result = await dbManager.initializeDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    });
  }
});

// Get connection status
router.get('/status', (req, res) => {
  try {
    const status = dbManager.getConnectionStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status',
      error: error.message
    });
  }
});

export default router;