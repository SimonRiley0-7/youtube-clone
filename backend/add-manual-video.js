// Add manually uploaded video to database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addManualVideo() {
  try {
    // Your actual video details
    const title = "Desktop Organizer Fully Editable in Canva";
    const description = "A tutorial on desktop organizer design using Canva";
    const s3_key = "4 Desktop Organizer Fully Editable in Canva.mp4";
    
    console.log('Adding video to database...');
    
    const result = await pool.query(
      'INSERT INTO videos (title, description, s3_key) VALUES ($1, $2, $3) RETURNING *',
      [title, description, s3_key]
    );
    
    console.log('✅ Video added successfully!');
    console.log('Video details:', result.rows[0]);
    
    // Show all videos
    const allVideos = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
    console.log('\n📺 All videos in database:');
    allVideos.rows.forEach(video => {
      console.log(`- ${video.title} (${video.s3_key})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding video:', error.message);
  } finally {
    pool.end();
  }
}

addManualVideo();
