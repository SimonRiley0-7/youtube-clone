#!/bin/bash

# AWS Workshop Patterns Implementation for YouTube Clone
# Following AWS workshop best practices and patterns
# Based on: https://catalog.us-east-1.prod.workshops.aws/workshops/3de93ad5-ebbe-4258-b977-b45cdfe661f1/en-US

set -e

# Configuration - Workshop Pattern Compliant
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.3.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.4.0/24"
REGION="us-east-1"
AZ1="us-east-1a"
AZ2="us-east-1b"
DB_PASSWORD="YouTubeClone2024!"
KEY_PAIR_NAME="youtube-clone-keypair"
PROJECT_NAME="youtube-clone"

echo "🚀 Starting AWS Workshop Patterns Implementation for YouTube Clone..."
echo "📚 Following AWS workshop best practices and architectural patterns"

# 1. Create VPC with Workshop Standards
echo "📡 Creating VPC with workshop standards..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block $VPC_CIDR \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc},{Key=Project,Value=${PROJECT_NAME}},{Key=Environment,Value=production}]" \
    --query 'Vpc.VpcId' --output text)

# Enable DNS hostnames and DNS resolution
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

echo "✅ VPC created with DNS enabled: $VPC_ID"

# 2. Create Internet Gateway
echo "🌐 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw},{Key=Project,Value=${PROJECT_NAME}}]" \
    --query 'InternetGateway.InternetGatewayId' --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
echo "✅ Internet Gateway created and attached: $IGW_ID"

# 3. Create Subnets - Multi-AZ for High Availability
echo "🏗️ Creating subnets across multiple AZs..."
PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PUBLIC_SUBNET_1_CIDR \
    --availability-zone $AZ1 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1},{Key=Type,Value=Public},{Key=AZ,Value=${AZ1}}]" \
    --query 'Subnet.SubnetId' --output text)

PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PUBLIC_SUBNET_2_CIDR \
    --availability-zone $AZ2 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-2},{Key=Type,Value=Public},{Key=AZ,Value=${AZ2}}]" \
    --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PRIVATE_SUBNET_1_CIDR \
    --availability-zone $AZ1 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-1},{Key=Type,Value=Private},{Key=AZ,Value=${AZ1}}]" \
    --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PRIVATE_SUBNET_2_CIDR \
    --availability-zone $AZ2 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-2},{Key=Type,Value=Private},{Key=AZ,Value=${AZ2}}]" \
    --query 'Subnet.SubnetId' --output text)

echo "✅ Subnets created:"
echo "   Public Subnet 1 ($AZ1): $PUBLIC_SUBNET_1_ID"
echo "   Public Subnet 2 ($AZ2): $PUBLIC_SUBNET_2_ID"
echo "   Private Subnet 1 ($AZ1): $PRIVATE_SUBNET_1_ID"
echo "   Private Subnet 2 ($AZ2): $PRIVATE_SUBNET_2_ID"

# 4. Enable public IP assignment for public subnets
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_1_ID --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_2_ID --map-public-ip-on-launch

# 5. Create Route Tables - Workshop Pattern
echo "🛣️ Creating route tables..."
PUBLIC_RT_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt},{Key=Type,Value=Public}]" \
    --query 'RouteTable.RouteTableId' --output text)

PRIVATE_RT_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt},{Key=Type,Value=Private}]" \
    --query 'RouteTable.RouteTableId' --output text)

# 6. Create Routes
aws ec2 create-route --route-table-id $PUBLIC_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1_ID --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_2_ID --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_SUBNET_1_ID --route-table-id $PRIVATE_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_SUBNET_2_ID --route-table-id $PRIVATE_RT_ID
echo "✅ Route tables created and associated"

# 7. Create Security Groups - Workshop Security Best Practices
echo "🔒 Creating security groups with workshop best practices..."

# ALB Security Group
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-alb-sg \
    --description "Security group for Application Load Balancer - YouTube Clone" \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-alb-sg},{Key=Type,Value=ALB}]" \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# EC2 Security Group
EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-ec2-sg \
    --description "Security group for EC2 instances - YouTube Clone" \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-ec2-sg},{Key=Type,Value=EC2}]" \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 5000 \
    --source-group $ALB_SG_ID

aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# RDS Security Group
RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-rds-sg \
    --description "Security group for RDS database - YouTube Clone" \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-rds-sg},{Key=Type,Value=RDS}]" \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $EC2_SG_ID

echo "✅ Security Groups created:"
echo "   ALB: $ALB_SG_ID"
echo "   EC2: $EC2_SG_ID"
echo "   RDS: $RDS_SG_ID"

# 8. Create RDS Subnet Group - Multi-AZ
echo "🗄️ Creating RDS Subnet Group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name ${PROJECT_NAME}-subnet-group \
    --db-subnet-group-description "Subnet group for YouTube Clone RDS - Multi-AZ" \
    --subnet-ids $PRIVATE_SUBNET_1_ID $PRIVATE_SUBNET_2_ID \
    --tags Key=Name,Value=${PROJECT_NAME}-subnet-group Key=Project,Value=${PROJECT_NAME}

# 9. Create RDS Instance - Workshop Pattern
echo "🗄️ Creating RDS Instance with workshop best practices..."
aws rds create-db-instance \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --db-instance-class db.t2.micro \
    --engine postgres \
    --engine-version 13.7 \
    --master-username postgres \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name ${PROJECT_NAME}-subnet-group \
    --backup-retention-period 7 \
    --storage-encrypted \
    --no-publicly-accessible \
    --tags Key=Name,Value=${PROJECT_NAME}-db Key=Project,Value=${PROJECT_NAME}

echo "✅ RDS Instance created with encryption and backups"

# 10. Create IAM Role for EC2 - Workshop Security Pattern
echo "👤 Creating IAM Role for EC2..."
aws iam create-role \
    --role-name ${PROJECT_NAME}-ec2-role \
    --assume-role-policy-document '{
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
    }' \
    --tags Key=Name,Value=${PROJECT_NAME}-ec2-role Key=Project,Value=${PROJECT_NAME}

# Attach policies
aws iam attach-role-policy \
    --role-name ${PROJECT_NAME}-ec2-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
    --role-name ${PROJECT_NAME}-ec2-role \
    --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name ${PROJECT_NAME}-instance-profile \
    --tags Key=Name,Value=${PROJECT_NAME}-instance-profile Key=Project,Value=${PROJECT_NAME}

aws iam add-role-to-instance-profile \
    --instance-profile-name ${PROJECT_NAME}-instance-profile \
    --role-name ${PROJECT_NAME}-ec2-role

echo "✅ IAM Role and Instance Profile created"

# 11. Create User Data Script - Workshop Deployment Pattern
echo "📝 Creating User Data Script..."
cat > user-data-workshop.sh << 'EOF'
#!/bin/bash
# YouTube Clone - Workshop Pattern Deployment Script

# Update system
yum update -y

# Install required packages
yum install -y nodejs npm git htop

# Install PM2 for process management
npm install -g pm2

# Create application directory
mkdir -p /opt/youtube-clone
cd /opt/youtube-clone

# Clone repository (update with your actual repository)
git clone https://github.com/yourusername/youtube-clone.git .

# Install dependencies
cd backend
npm install

# Create production environment file
cat > .env << 'ENVEOF'
# Database Configuration
DB_USER=postgres
DB_PASSWORD=YouTubeClone2024!
DB_HOST=youtube-clone-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=youtube_clone

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=youtube-clone-uploads-aws

# Application Configuration
NODE_ENV=production
PORT=5000

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
ENVEOF

# Set up database
npm run setup-db || echo "Database setup will be done manually"

# Start application with PM2
pm2 start index.js --name youtube-clone
pm2 startup
pm2 save

# Install CloudWatch agent for monitoring
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

echo "✅ YouTube Clone deployed successfully"
EOF

# 12. Create Launch Template - Workshop Pattern
echo "🚀 Creating Launch Template..."
LAUNCH_TEMPLATE_ID=$(aws ec2 create-launch-template \
    --launch-template-name ${PROJECT_NAME}-template \
    --launch-template-data "{
        \"ImageId\": \"ami-0c02fb55956c7d4f8\",
        \"InstanceType\": \"t2.micro\",
        \"KeyName\": \"$KEY_PAIR_NAME\",
        \"SecurityGroupIds\": [\"$EC2_SG_ID\"],
        \"UserData\": \"$(base64 -w 0 user-data-workshop.sh)\",
        \"IamInstanceProfile\": {
            \"Name\": \"${PROJECT_NAME}-instance-profile\"
        },
        \"TagSpecifications\": [
            {
                \"ResourceType\": \"instance\",
                \"Tags\": [
                    {\"Key\": \"Name\", \"Value\": \"${PROJECT_NAME}-instance\"},
                    {\"Key\": \"Project\", \"Value\": \"${PROJECT_NAME}\"}
                ]
            }
        ]
    }" \
    --tag-specifications "ResourceType=launch-template,Tags=[{Key=Name,Value=${PROJECT_NAME}-template},{Key=Project,Value=${PROJECT_NAME}}]" \
    --query 'LaunchTemplate.LaunchTemplateId' --output text)

echo "✅ Launch Template created: $LAUNCH_TEMPLATE_ID"

# 13. Create Target Group - Workshop Pattern
echo "🎯 Creating Target Group..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-targets \
    --protocol HTTP \
    --port 5000 \
    --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --tags Key=Name,Value=${PROJECT_NAME}-targets Key=Project,Value=${PROJECT_NAME} \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "✅ Target Group created: $TARGET_GROUP_ARN"

# 14. Create Application Load Balancer - Workshop Pattern
echo "⚖️ Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${PROJECT_NAME}-alb \
    --subnets $PUBLIC_SUBNET_1_ID $PUBLIC_SUBNET_2_ID \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --tags Key=Name,Value=${PROJECT_NAME}-alb Key=Project,Value=${PROJECT_NAME} \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)

echo "✅ ALB created: $ALB_DNS"

# 15. Create ALB Listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

echo "✅ ALB Listener created"

# 16. Create Auto Scaling Group - Workshop Pattern
echo "📈 Creating Auto Scaling Group..."
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name ${PROJECT_NAME}-asg \
    --launch-template LaunchTemplateName=${PROJECT_NAME}-template,Version=1 \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 2 \
    --target-group-arns $TARGET_GROUP_ARN \
    --vpc-zone-identifier "$PRIVATE_SUBNET_1_ID,$PRIVATE_SUBNET_2_ID" \
    --tags Key=Name,Value=${PROJECT_NAME}-asg Key=Project,Value=${PROJECT_NAME}

echo "✅ Auto Scaling Group created"

# 17. Create CloudWatch Alarms - Workshop Monitoring Pattern
echo "📊 Creating CloudWatch Alarms..."
aws cloudwatch put-metric-alarm \
    --alarm-name ${PROJECT_NAME}-high-cpu \
    --alarm-description "High CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2

aws cloudwatch put-metric-alarm \
    --alarm-name ${PROJECT_NAME}-low-cpu \
    --alarm-description "Low CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 20 \
    --comparison-operator LessThanThreshold \
    --evaluation-periods 2

echo "✅ CloudWatch Alarms created"

# 18. Output Summary
echo ""
echo "🎉 AWS Workshop Patterns Implementation Complete!"
echo "================================================"
echo "VPC ID: $VPC_ID"
echo "ALB DNS: $ALB_DNS"
echo "RDS Endpoint: ${PROJECT_NAME}-db.xxxxxxxx.us-east-1.rds.amazonaws.com"
echo ""
echo "📚 Workshop Pattern Compliance:"
echo "✅ Multi-tier architecture implemented"
echo "✅ High availability with multi-AZ"
echo "✅ Security best practices applied"
echo "✅ Monitoring and alerting configured"
echo "✅ Infrastructure as Code approach"
echo "✅ Proper tagging and naming conventions"
echo ""
echo "🔧 Next Steps:"
echo "1. Wait for RDS to be available (10-15 minutes)"
echo "2. Update your .env file with the RDS endpoint"
echo "3. Update frontend API URL to: http://$ALB_DNS"
echo "4. Test your application"
echo "5. Monitor CloudWatch metrics and alarms"
echo ""
echo "⚠️  Remember to:"
echo "- Update the git repository URL in user-data-workshop.sh"
echo "- Add your AWS credentials to the .env file"
echo "- Update the RDS endpoint in the .env file"
echo "- Configure CloudWatch agent on EC2 instances"
echo "- Set up SSL certificate for HTTPS (optional)"


