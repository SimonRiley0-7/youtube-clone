// index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const s3 = require('./s3');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});