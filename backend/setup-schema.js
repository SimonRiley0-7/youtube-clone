// Setup database schema
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

async function setupSchema() {
  try {
    console.log('🗄️ Setting up database schema...');
    
    // Create videos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        s3_key VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_s3_key ON videos(s3_key);
    `);
    
    console.log('✅ Database schema created successfully!');
    
    // Test insert sample data
    await pool.query(`
      INSERT INTO videos (title, description, s3_key) VALUES
      ('Sample Video 1', 'This is a sample video for testing', 'sample-video-1.mp4'),
      ('Sample Video 2', 'Another sample video', 'sample-video-2.mp4')
      ON CONFLICT (s3_key) DO NOTHING;
    `);
    
    console.log('✅ Sample data inserted!');
    
    // Verify setup
    const result = await pool.query('SELECT COUNT(*) as count FROM videos');
    console.log(`📊 Total videos in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error setting up schema:', error.message);
  } finally {
    pool.end();
  }
}

setupSchema();
