-- Database setup for YouTube Clone
-- Run this script in your PostgreSQL database

-- Create the videos table
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    s3_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_s3_key ON videos(s3_key);

-- Insert sample data (optional)
INSERT INTO videos (title, description, s3_key) VALUES
('Sample Video 1', 'This is a sample video for testing', 'sample-video-1.mp4'),
('Sample Video 2', 'Another sample video', 'sample-video-2.mp4')
ON CONFLICT (s3_key) DO NOTHING;






