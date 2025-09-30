# AWS Setup Instructions for YouTube Clone

## Environment Configuration

After setting up AWS services, update your `.env` file with these values:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_rds_password
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_DATABASE=youtube_clone

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=youtube-clone-uploads-your-name
```

## Important Notes

1. **RDS Endpoint**: Find in RDS Console → Databases → your-db → Connectivity & security
2. **S3 Bucket Names**: Must be globally unique, add your name/number
3. **Region**: Keep everything in us-east-1 for lowest costs
4. **Security**: Use strong passwords and keep credentials secure

## Cost Monitoring

- Set up billing alerts for $10, $50, $90
- Monitor usage in AWS Cost Explorer
- Stop instances when not in use

## Testing Database Connection

Run this after setup:
```bash
cd backend
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err.message);
  else console.log('✅ Database connected:', res.rows[0]);
  pool.end();
});
"
```





