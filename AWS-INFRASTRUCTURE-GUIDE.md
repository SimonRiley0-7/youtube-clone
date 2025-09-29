# AWS Infrastructure Implementation Guide for YouTube Clone

## 🏗️ Current Architecture vs. Production Architecture

### Current Setup (Local Development)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Local)       │───▶│   (localhost)   │───▶│   (Local/RDS)   │
│   HTML/CSS/JS   │    │   Node.js:5000  │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3        │
                       │   (Videos)      │
                       └─────────────────┘
```

### Production Architecture (VPC + EC2 + RDS + ALB)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │   VPC           │    │   Private       │
│   Users         │───▶│   (10.0.0.0/16) │    │   Subnet        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   ALB           │    │   RDS           │
                       │   (Public)      │    │   PostgreSQL    │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   EC2 Instances │
                       │   (Private)     │
                       │   Node.js App   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3        │
                       │   (Videos)      │
                       └─────────────────┘
```

## 📊 What is RDS Used For?

### RDS (Relational Database Service) Purpose:
- **Video Metadata Storage**: Stores video information (title, description, S3 keys, timestamps)
- **User Data**: User accounts, playlists, comments (if implemented)
- **Application Data**: Any relational data your app needs
- **Managed Service**: AWS handles backups, updates, scaling, monitoring

### Current Database Schema:
```sql
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    s3_key VARCHAR(255) UNIQUE NOT NULL,
    thumbnail_s3_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Step-by-Step Implementation

### 1. VPC (Virtual Private Cloud) Setup

#### Create VPC:
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=youtube-clone-vpc}]'

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=youtube-clone-igw}]'

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway --vpc-id vpc-xxxxxxxx --internet-gateway-id igw-xxxxxxxx
```

#### Create Subnets:
```bash
# Public Subnet (for ALB)
aws ec2 create-subnet --vpc-id vpc-xxxxxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=youtube-clone-public-subnet}]'

# Private Subnet 1 (for EC2)
aws ec2 create-subnet --vpc-id vpc-xxxxxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=youtube-clone-private-subnet-1}]'

# Private Subnet 2 (for RDS)
aws ec2 create-subnet --vpc-id vpc-xxxxxxxx --cidr-block 10.0.3.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=youtube-clone-private-subnet-2}]'
```

#### Create Route Tables:
```bash
# Public Route Table
aws ec2 create-route-table --vpc-id vpc-xxxxxxxx --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=youtube-clone-public-rt}]'

# Private Route Table
aws ec2 create-route-table --vpc-id vpc-xxxxxxxx --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=youtube-clone-private-rt}]'
```

### 2. Security Groups

#### ALB Security Group:
```bash
aws ec2 create-security-group --group-name youtube-clone-alb-sg --description "Security group for ALB" --vpc-id vpc-xxxxxxxx

# Allow HTTP/HTTPS from internet
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0
```

#### EC2 Security Group:
```bash
aws ec2 create-security-group --group-name youtube-clone-ec2-sg --description "Security group for EC2 instances" --vpc-id vpc-xxxxxxxx

# Allow traffic from ALB only
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 5000 --source-group sg-xxxxxxxx
```

#### RDS Security Group:
```bash
aws ec2 create-security-group --group-name youtube-clone-rds-sg --description "Security group for RDS" --vpc-id vpc-xxxxxxxx

# Allow PostgreSQL from EC2 only
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 5432 --source-group sg-xxxxxxxx
```

### 3. RDS Setup

#### Create RDS Subnet Group:
```bash
aws rds create-db-subnet-group \
    --db-subnet-group-name youtube-clone-subnet-group \
    --db-subnet-group-description "Subnet group for YouTube Clone RDS" \
    --subnet-ids subnet-xxxxxxxx subnet-yyyyyyyy
```

#### Create RDS Instance:
```bash
aws rds create-db-instance \
    --db-instance-identifier youtube-clone-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 13.7 \
    --master-username postgres \
    --master-user-password YourSecurePassword123! \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxxxxxx \
    --db-subnet-group-name youtube-clone-subnet-group \
    --backup-retention-period 7 \
    --storage-encrypted
```

### 4. EC2 Setup

#### Create Launch Template:
```bash
aws ec2 create-launch-template \
    --launch-template-name youtube-clone-template \
    --launch-template-data '{
        "ImageId": "ami-0c02fb55956c7d4f8",
        "InstanceType": "t3.micro",
        "KeyName": "your-key-pair",
        "SecurityGroupIds": ["sg-xxxxxxxx"],
        "UserData": "'$(base64 -w 0 user-data.sh)'",
        "IamInstanceProfile": {
            "Name": "youtube-clone-instance-profile"
        }
    }'
```

#### User Data Script (user-data.sh):
```bash
#!/bin/bash
yum update -y
yum install -y nodejs npm git

# Clone your repository
git clone https://github.com/yourusername/youtube-clone.git
cd youtube-clone/backend

# Install dependencies
npm install

# Install PM2 for process management
npm install -g pm2

# Create environment file
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!
DB_HOST=youtube-clone-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=youtube_clone
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=youtube-clone-uploads-aws
NODE_ENV=production
PORT=5000
EOF

# Start application with PM2
pm2 start index.js --name youtube-clone
pm2 startup
pm2 save
```

### 5. Application Load Balancer (ALB)

#### Create Target Group:
```bash
aws elbv2 create-target-group \
    --name youtube-clone-targets \
    --protocol HTTP \
    --port 5000 \
    --vpc-id vpc-xxxxxxxx \
    --target-type instance \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3
```

#### Create ALB:
```bash
aws elbv2 create-load-balancer \
    --name youtube-clone-alb \
    --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
    --security-groups sg-xxxxxxxx \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4
```

#### Create Listener:
```bash
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/youtube-clone-alb/xxxxxxxx \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/youtube-clone-targets/xxxxxxxx
```

### 6. Auto Scaling Group

#### Create Auto Scaling Group:
```bash
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name youtube-clone-asg \
    --launch-template LaunchTemplateName=youtube-clone-template,Version=1 \
    --min-size 2 \
    --max-size 10 \
    --desired-capacity 2 \
    --target-group-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/youtube-clone-targets/xxxxxxxx \
    --vpc-zone-identifier "subnet-xxxxxxxx,subnet-yyyyyyyy"
```

## 🔧 Code Changes Required

### 1. Add Health Check Endpoint

Add to `backend/index.js`:
```javascript
// Health check endpoint for ALB
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

### 2. Update Frontend API URL

Update `frontend/js/api.js`:
```javascript
// Production API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-alb-dns-name.us-east-1.elb.amazonaws.com'
    : 'http://localhost:5000';
```

### 3. Environment Variables for Production

Create `backend/.env.production`:
```env
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!
DB_HOST=youtube-clone-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=youtube_clone
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=youtube-clone-uploads-aws
NODE_ENV=production
PORT=5000
```

## 💰 Cost Estimation

### Monthly Costs (us-east-1):
- **EC2 (t3.micro)**: $8.50/month × 2 instances = $17.00
- **RDS (db.t3.micro)**: $15.00/month
- **ALB**: $16.20/month + $0.008/LCU-hour
- **S3**: $0.023/GB/month (storage) + $0.09/GB (transfer)
- **Data Transfer**: $0.09/GB (outbound)

**Total**: ~$50-60/month for basic setup

## 🚀 Deployment Steps

1. **Create VPC and networking components**
2. **Set up RDS database**
3. **Create EC2 instances with your application**
4. **Configure ALB and target groups**
5. **Set up Auto Scaling Group**
6. **Update DNS to point to ALB**
7. **Test the complete setup**

## 🔒 Security Best Practices

1. **Use private subnets for EC2 and RDS**
2. **Implement proper security groups**
3. **Use IAM roles instead of access keys**
4. **Enable VPC Flow Logs**
5. **Use AWS WAF for additional protection**
6. **Enable RDS encryption at rest**
7. **Regular security updates and patches**

This architecture provides high availability, scalability, and security for your YouTube clone application!


