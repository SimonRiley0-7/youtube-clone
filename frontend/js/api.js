// js/api.js

const API_BASE_URL = 'http://localhost:5000'; // Change to your EC2 public IP when deployed

/**
 * Fetches all processed videos from the server.
 * @returns {Promise<Array>}
 */
async function getAllVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return []; // Return an empty list on error
  }
}

/**
 * Fetches a single video by its unique key using the dedicated backend endpoint.
 * @param {string} videoKey The s3_key of the video.
 * @returns {Promise<Object|null>}
 */
async function getVideoById(videoKey) {
  try {
    console.log('🔍 Fetching video with key:', videoKey);
    const encodedKey = encodeURIComponent(videoKey);
    const response = await fetch(`${API_BASE_URL}/videos/${encodedKey}`);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const videoData = await response.json();
    console.log('✅ Video data received:', videoData);
    return videoData;
  } catch (error) {
    console.error(`Failed to fetch video ${videoKey}:`, error);
    return null;
  }
}

// --- Upload and metadata functions ---

async function getUploadUrl() {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-upload-url`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not get upload URL:", error);
    return null;
  }
}

async function getThumbnailUploadUrl(fileType) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-thumbnail-upload-url?fileType=${encodeURIComponent(fileType)}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not get thumbnail upload URL:", error);
    return null;
  }
}

async function saveVideoMetadata(title, description, s3_key, thumbnail_s3_key) {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, s3_key, thumbnail_s3_key }),
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not save video metadata:", error);
    return null;
  }
}

/**
 * Get video duration by loading the video and reading its metadata
 * @param {string} videoKey The s3_key of the video
 * @returns {Promise<string|null>} Duration in MM:SS format or null if failed
 */
async function getVideoDuration(videoKey) {
  try {
    const S3_BUCKET_URL = 'https://youtube-clone-uploads-aws.s3.us-east-1.amazonaws.com';
    const videoUrl = `${S3_BUCKET_URL}/${videoKey}`;
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        if (duration && !isNaN(duration)) {
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          resolve('0:00');
        }
        // Clean up
        video.remove();
      });
      
      video.addEventListener('error', () => {
        console.error('Error loading video metadata for duration:', videoUrl);
        resolve('0:00');
        video.remove();
      });
      
      // Set a timeout to avoid hanging
      setTimeout(() => {
        resolve('0:00');
        video.remove();
      }, 5000);
      
      video.src = videoUrl;
    });
  } catch (error) {
    console.error('Error getting video duration:', error);
    return '0:00';
  }
}