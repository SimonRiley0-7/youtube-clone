// index.js - YouTube Clone Backend
// AWS Workshop Pattern Implementation
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const db = require('./db');
const s3 = require('./s3');

const app = express();
const port = process.env.PORT || 5000;

// Security middleware - Workshop best practices
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- API Endpoints ---
app.get('/videos', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.get('/videos/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const decodedKey = decodeURIComponent(key);
        console.log('🔍 Looking for video with key:', decodedKey);
        
        const result = await db.query('SELECT * FROM videos WHERE s3_key = $1', [decodedKey]);
        
        if (result.rows.length === 0) {
            console.log('❌ Video not found:', decodedKey);
            return res.status(404).send('Video not found');
        }
        
        console.log('✅ Video found:', result.rows[0].title);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/generate-upload-url', s3.getUploadURL);
app.get('/generate-thumbnail-upload-url', s3.getThumbnailUploadURL);

// Get video duration endpoint
app.get('/video-duration/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const decodedKey = decodeURIComponent(key);
        
        // Get the video URL from S3
        const S3_BUCKET_URL = 'https://youtube-clone-uploads-aws.s3.us-east-1.amazonaws.com';
        const videoUrl = `${S3_BUCKET_URL}/${decodedKey}`;
        
        // For now, we'll return a placeholder duration
        // In a real implementation, you'd use ffprobe or similar to get actual duration
        res.json({ 
            duration: null, // Will be calculated on frontend
            videoUrl: videoUrl 
        });
    } catch (err) {
        console.error('Error getting video duration:', err);
        res.status(500).send('Server Error');
    }
});

app.post('/videos', async (req, res) => {
  const { title, description, s3_key, thumbnail_s3_key } = req.body;
  if (!title || !s3_key) return res.status(400).send('Title and s3_key are required.');
  try {
    const queryText = 'INSERT INTO videos(title, description, s3_key, thumbnail_s3_key) VALUES($1, $2, $3, $4) RETURNING *';
    const result = await db.query(queryText, [title, description, s3_key, thumbnail_s3_key]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server Error');
  }
});

// Health check endpoint for ALB - Workshop pattern
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await db.query('SELECT 1');
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'youtube-clone-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'youtube-clone-backend',
      error: error.message,
      database: 'disconnected'
    });
  }
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Liveness check endpoint
app.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Error handling middleware - Workshop pattern
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 YouTube Clone Backend Server is running on port ${port}`);
  console.log(`📊 Health check available at: http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});