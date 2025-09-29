// Quick database connection test
const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing database connection...');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_DATABASE);
console.log('User:', process.env.DB_USER);

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

pool.query('SELECT NOW() as current_time, version() as pg_version', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
  } else {
    console.log('✅ Database connected successfully!');
    console.log('Current time:', res.rows[0].current_time);
    console.log('PostgreSQL version:', res.rows[0].pg_version);
  }
  pool.end();
});
