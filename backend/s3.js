// s3.js (The Correct and Final Version)

require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getUploadURL(req, res) {
  try {
    const videoKey = `videos/${crypto.randomUUID()}.mp4`;

    const videoCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: videoKey,
      ContentType: 'video/mp4',
    });

    const videoUploadUrl = await getSignedUrl(s3Client, videoCommand, { expiresIn: 3600 });
    res.json({ uploadUrl: videoUploadUrl, key: videoKey });
  } catch (error) {
    console.error('S3 Upload URL Error:', error);
    res.status(500).json({
      error: 'Error generating upload URL',
      details: error.message
    });
  }
}

async function getThumbnailUploadURL(req, res) {
  try {
    const { fileType } = req.query; // jpg or png
    const extension = fileType === 'image/png' ? '.png' : '.jpg';
    const thumbnailKey = `thumbnails/${crypto.randomUUID()}${extension}`;

    const thumbnailCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: thumbnailKey,
      ContentType: fileType || 'image/jpeg',
    });

    const thumbnailUploadUrl = await getSignedUrl(s3Client, thumbnailCommand, { expiresIn: 3600 });
    res.json({ uploadUrl: thumbnailUploadUrl, key: thumbnailKey });
  } catch (error) {
    console.error('S3 Thumbnail Upload URL Error:', error);
    res.status(500).json({
      error: 'Error generating thumbnail upload URL',
      details: error.message
    });
  }
}

module.exports = { getUploadURL, getThumbnailUploadURL };