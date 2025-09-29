#!/bin/bash

# AWS Infrastructure Deployment Script for YouTube Clone - FREE TIER VERSION
# This script uses only AWS Free Tier eligible resources
# Make sure you have AWS CLI configured with appropriate permissions

set -e

# Configuration - FREE TIER OPTIMIZED
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_CIDR="10.0.1.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.3.0/24"
REGION="us-east-1"
AZ1="us-east-1a"
AZ2="us-east-1b"
DB_PASSWORD="YourSecurePassword123!"
KEY_PAIR_NAME="your-key-pair"  # Change this to your actual key pair

echo "🚀 Starting AWS Infrastructure Deployment for YouTube Clone - FREE TIER VERSION..."
echo "💰 This deployment uses only AWS Free Tier eligible resources"

# 1. Create VPC
echo "📡 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=youtube-clone-vpc-free}]' --query 'Vpc.VpcId' --output text)
echo "✅ VPC created: $VPC_ID"

# 2. Create Internet Gateway
echo "🌐 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=youtube-clone-igw-free}]' --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
echo "✅ Internet Gateway created and attached: $IGW_ID"

# 3. Create Subnets
echo "🏗️ Creating Subnets..."
PUBLIC_SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $PUBLIC_SUBNET_CIDR --availability-zone $AZ1 --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=youtube-clone-public-subnet-free}]' --query 'Subnet.SubnetId' --output text)
PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $PRIVATE_SUBNET_1_CIDR --availability-zone $AZ1 --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=youtube-clone-private-subnet-1-free}]' --query 'Subnet.SubnetId' --output text)
PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $PRIVATE_SUBNET_2_CIDR --availability-zone $AZ2 --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=youtube-clone-private-subnet-2-free}]' --query 'Subnet.SubnetId' --output text)
echo "✅ Subnets created:"
echo "   Public: $PUBLIC_SUBNET_ID"
echo "   Private 1: $PRIVATE_SUBNET_1_ID"
echo "   Private 2: $PRIVATE_SUBNET_2_ID"

# 4. Enable public IP assignment for public subnet
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_ID --map-public-ip-on-launch

# 5. Create Route Tables
echo "🛣️ Creating Route Tables..."
PUBLIC_RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=youtube-clone-public-rt-free}]' --query 'RouteTable.RouteTableId' --output text)
PRIVATE_RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=youtube-clone-private-rt-free}]' --query 'RouteTable.RouteTableId' --output text)

# 6. Create Routes
aws ec2 create-route --route-table-id $PUBLIC_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_ID --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_SUBNET_1_ID --route-table-id $PRIVATE_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_SUBNET_2_ID --route-table-id $PRIVATE_RT_ID
echo "✅ Route tables created and associated"

# 7. Create Security Groups
echo "🔒 Creating Security Groups..."

# ALB Security Group
ALB_SG_ID=$(aws ec2 create-security-group --group-name youtube-clone-alb-sg-free --description "Security group for ALB - Free Tier" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0

# EC2 Security Group
EC2_SG_ID=$(aws ec2 create-security-group --group-name youtube-clone-ec2-sg-free --description "Security group for EC2 instances - Free Tier" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 5000 --source-group $ALB_SG_ID
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0  # SSH access

# RDS Security Group
RDS_SG_ID=$(aws ec2 create-security-group --group-name youtube-clone-rds-sg-free --description "Security group for RDS - Free Tier" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID --protocol tcp --port 5432 --source-group $EC2_SG_ID

echo "✅ Security Groups created:"
echo "   ALB: $ALB_SG_ID"
echo "   EC2: $EC2_SG_ID"
echo "   RDS: $RDS_SG_ID"

# 8. Create RDS Subnet Group
echo "🗄️ Creating RDS Subnet Group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name youtube-clone-subnet-group-free \
    --db-subnet-group-description "Subnet group for YouTube Clone RDS - Free Tier" \
    --subnet-ids $PRIVATE_SUBNET_1_ID $PRIVATE_SUBNET_2_ID

# 9. Create RDS Instance - FREE TIER (db.t2.micro)
echo "🗄️ Creating RDS Instance (Free Tier - db.t2.micro)..."
aws rds create-db-instance \
    --db-instance-identifier youtube-clone-db-free \
    --db-instance-class db.t2.micro \
    --engine postgres \
    --engine-version 13.7 \
    --master-username postgres \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name youtube-clone-subnet-group-free \
    --backup-retention-period 1 \
    --storage-encrypted \
    --no-publicly-accessible

echo "✅ RDS Instance created (Free Tier - db.t2.micro)"

# 10. Create IAM Role for EC2
echo "👤 Creating IAM Role for EC2..."
aws iam create-role --role-name youtube-clone-ec2-role-free --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}'

aws iam attach-role-policy --role-name youtube-clone-ec2-role-free --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam create-instance-profile --instance-profile-name youtube-clone-instance-profile-free
aws iam add-role-to-instance-profile --instance-profile-name youtube-clone-instance-profile-free --role-name youtube-clone-ec2-role-free

echo "✅ IAM Role created"

# 11. Create User Data Script - OPTIMIZED FOR FREE TIER
echo "📝 Creating User Data Script (Free Tier Optimized)..."
cat > user-data-free-tier.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y nodejs npm git

# Install PM2
npm install -g pm2

# Clone repository (you'll need to update this with your actual repo)
git clone https://github.com/yourusername/youtube-clone.git /opt/youtube-clone
cd /opt/youtube-clone/backend

# Install dependencies
npm install

# Create environment file
cat > .env << 'ENVEOF'
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!
DB_HOST=youtube-clone-db-free.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=youtube_clone
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=youtube-clone-uploads-aws
NODE_ENV=production
PORT=5000
ENVEOF

# Start application with PM2
pm2 start index.js --name youtube-clone
pm2 startup
pm2 save
EOF

# 12. Create Launch Template - FREE TIER (t2.micro)
echo "🚀 Creating Launch Template (Free Tier - t2.micro)..."
LAUNCH_TEMPLATE_ID=$(aws ec2 create-launch-template \
    --launch-template-name youtube-clone-template-free \
    --launch-template-data "{
        \"ImageId\": \"ami-0c02fb55956c7d4f8\",
        \"InstanceType\": \"t2.micro\",
        \"KeyName\": \"$KEY_PAIR_NAME\",
        \"SecurityGroupIds\": [\"$EC2_SG_ID\"],
        \"UserData\": \"$(base64 -w 0 user-data-free-tier.sh)\",
        \"IamInstanceProfile\": {
            \"Name\": \"youtube-clone-instance-profile-free\"
        }
    }" \
    --query 'LaunchTemplate.LaunchTemplateId' --output text)

echo "✅ Launch Template created: $LAUNCH_TEMPLATE_ID"

# 13. Create Target Group
echo "🎯 Creating Target Group..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name youtube-clone-targets-free \
    --protocol HTTP \
    --port 5000 \
    --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "✅ Target Group created: $TARGET_GROUP_ARN"

# 14. Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name youtube-clone-alb-free \
    --subnets $PUBLIC_SUBNET_ID \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)

echo "✅ ALB created: $ALB_DNS"

# 15. Create ALB Listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

echo "✅ ALB Listener created"

# 16. Create Auto Scaling Group - FREE TIER (1 instance only)
echo "📈 Creating Auto Scaling Group (Free Tier - 1 instance)..."
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name youtube-clone-asg-free \
    --launch-template LaunchTemplateName=youtube-clone-template-free,Version=1 \
    --min-size 1 \
    --max-size 1 \
    --desired-capacity 1 \
    --target-group-arns $TARGET_GROUP_ARN \
    --vpc-zone-identifier "$PRIVATE_SUBNET_1_ID"

echo "✅ Auto Scaling Group created (Free Tier - 1 instance)"

# 17. Output Summary
echo ""
echo "🎉 FREE TIER Infrastructure Deployment Complete!"
echo "=============================================="
echo "VPC ID: $VPC_ID"
echo "ALB DNS: $ALB_DNS"
echo "RDS Endpoint: youtube-clone-db-free.xxxxxxxx.us-east-1.rds.amazonaws.com"
echo ""
echo "💰 FREE TIER RESOURCES USED:"
echo "- EC2: 1x t2.micro (750 hours/month free)"
echo "- RDS: 1x db.t2.micro (750 hours/month free)"
echo "- ALB: 1x Application Load Balancer (750 hours/month free)"
echo "- S3: 5GB storage (free tier)"
echo "- Data Transfer: 1GB/month (free tier)"
echo ""
echo "⚠️  FREE TIER LIMITS:"
echo "- EC2: 750 hours/month (1 instance running 24/7)"
echo "- RDS: 750 hours/month (1 instance running 24/7)"
echo "- ALB: 750 hours/month (1 load balancer running 24/7)"
echo "- S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests"
echo "- Data Transfer: 1GB outbound per month"
echo ""
echo "Next Steps:"
echo "1. Wait for RDS to be available (10-15 minutes)"
echo "2. Update your .env file with the RDS endpoint"
echo "3. Update frontend API URL to: http://$ALB_DNS"
echo "4. Test your application"
echo ""
echo "⚠️  Remember to:"
echo "- Update the git repository URL in user-data-free-tier.sh"
echo "- Add your AWS credentials to the .env file"
echo "- Update the RDS endpoint in the .env file"
echo "- Monitor your usage to stay within free tier limits"
echo "- Stop/start instances when not in use to save hours"


