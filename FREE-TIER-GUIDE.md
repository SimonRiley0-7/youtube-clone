# 🆓 AWS Free Tier Implementation Guide for YouTube Clone

## 💰 Free Tier Resources Overview

### What's Included in AWS Free Tier (12 months from signup):

| Service | Free Tier Limit | What You Get |
|---------|----------------|--------------|
| **EC2** | 750 hours/month | 1x t2.micro instance (1 vCPU, 1 GB RAM) |
| **RDS** | 750 hours/month | 1x db.t2.micro instance (1 vCPU, 1 GB RAM) |
| **ALB** | 750 hours/month | 1x Application Load Balancer |
| **S3** | 5 GB storage | 5 GB storage, 20,000 GET, 2,000 PUT requests |
| **Data Transfer** | 1 GB/month | 1 GB outbound data transfer |
| **VPC** | Always free | VPC, subnets, route tables, security groups |

## 🏗️ Free Tier Architecture

```
Internet Users
      │
      ▼
┌─────────────────┐
│   ALB (Free)    │ ← 1x Application Load Balancer
│   Port 80       │   (750 hours/month free)
└─────────────────┘
      │
      ▼
┌─────────────────┐
│   EC2 Instance  │ ← 1x t2.micro instance
│   (Free)        │   (750 hours/month free)
│   Port 5000     │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│   RDS Database  │ ← 1x db.t2.micro instance
│   (Free)        │   (750 hours/month free)
└─────────────────┘
      │
      ▼
┌─────────────────┐
│   AWS S3        │ ← 5 GB storage free
│   (Free)        │   (20,000 GET, 2,000 PUT)
└─────────────────┘
```

## 🚀 Free Tier Deployment

### Prerequisites:
1. **New AWS Account** (within 12 months of signup)
2. **AWS CLI configured** with appropriate permissions
3. **Key pair created** in your AWS region
4. **Git repository** with your code
5. **S3 bucket** already created

### Quick Deployment:
```bash
# 1. Make script executable
chmod +x deploy-infrastructure-free-tier.sh

# 2. Update configuration in script
# - Change KEY_PAIR_NAME to your actual key pair
# - Update git repository URL
# - Set your AWS credentials

# 3. Run deployment
./deploy-infrastructure-free-tier.sh
```

## 💡 Free Tier Optimizations

### 1. **Single Instance Setup**
- **EC2**: 1x t2.micro instance (instead of 2-10)
- **RDS**: 1x db.t2.micro instance
- **ALB**: 1x Application Load Balancer
- **No Auto Scaling**: Fixed 1 instance to save hours

### 2. **Resource Limits**
- **Minimal backup retention**: 1 day (instead of 7)
- **Smaller storage**: 20 GB (instead of larger)
- **Single AZ**: No multi-AZ for RDS (saves costs)

### 3. **Cost Monitoring**
- **CloudWatch**: Monitor usage and set up billing alerts
- **AWS Cost Explorer**: Track free tier usage
- **Billing Alerts**: Set up alerts for $1, $5, $10

## 📊 Free Tier Usage Tracking

### Monthly Limits:
```
EC2: 750 hours/month
- 1 instance × 24 hours × 31 days = 744 hours ✅

RDS: 750 hours/month  
- 1 instance × 24 hours × 31 days = 744 hours ✅

ALB: 750 hours/month
- 1 load balancer × 24 hours × 31 days = 744 hours ✅

S3: 5 GB storage
- Video storage: ~2-3 GB ✅
- Thumbnails: ~100 MB ✅

Data Transfer: 1 GB/month
- Video streaming: Monitor usage ⚠️
```

## 🔧 Free Tier Configuration

### EC2 Instance (t2.micro):
```yaml
Instance Type: t2.micro
vCPUs: 1
Memory: 1 GB
Storage: 8 GB EBS (free tier)
Network: Low to Moderate
```

### RDS Instance (db.t2.micro):
```yaml
Instance Type: db.t2.micro
vCPUs: 1
Memory: 1 GB
Storage: 20 GB (free tier)
Engine: PostgreSQL 13.7
Backup: 1 day retention
```

### Application Load Balancer:
```yaml
Type: Application Load Balancer
Protocol: HTTP
Port: 80
Health Checks: /health endpoint
Targets: 1 EC2 instance
```

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| **EC2** | 750 hours | $0.00 |
| **RDS** | 750 hours | $0.00 |
| **ALB** | 750 hours | $0.00 |
| **S3** | 5 GB | $0.00 |
| **Data Transfer** | 1 GB | $0.00 |
| **VPC** | Always free | $0.00 |
| **Total** | | **$0.00/month** |

## ⚠️ Free Tier Limitations

### 1. **Performance Limits**
- **Low CPU/Memory**: t2.micro has limited resources
- **No Auto Scaling**: Fixed 1 instance
- **Single AZ**: No high availability
- **Limited Storage**: 5 GB S3, 20 GB RDS

### 2. **Usage Limits**
- **750 hours/month**: Can run 24/7 for 31 days
- **1 GB data transfer**: Limited video streaming
- **5 GB S3 storage**: Limited video storage
- **No multi-AZ**: Single point of failure

### 3. **Feature Limitations**
- **No HTTPS**: Only HTTP (no SSL certificate)
- **No CDN**: No CloudFront distribution
- **No WAF**: No web application firewall
- **No monitoring**: Limited CloudWatch metrics

## 🎯 Free Tier Best Practices

### 1. **Resource Management**
- **Stop instances** when not in use
- **Monitor usage** with CloudWatch
- **Set up billing alerts** for $1, $5, $10
- **Use AWS Cost Explorer** to track usage

### 2. **Performance Optimization**
- **Optimize video sizes** to reduce storage
- **Use compression** for thumbnails
- **Implement caching** to reduce requests
- **Monitor memory usage** on t2.micro

### 3. **Cost Control**
- **Regular cleanup** of unused resources
- **Monitor data transfer** usage
- **Use S3 lifecycle policies** for old videos
- **Implement video compression** to save storage

## 🔄 Free Tier to Paid Upgrade Path

### When to Upgrade:
1. **Traffic increases** beyond free tier limits
2. **Storage needs** exceed 5 GB
3. **Performance requirements** need more resources
4. **High availability** requirements

### Upgrade Options:
1. **EC2**: t2.small, t2.medium, t3.micro
2. **RDS**: db.t2.small, db.t3.micro
3. **S3**: Pay for additional storage
4. **ALB**: Continue using (minimal cost)

## 📋 Free Tier Checklist

### Before Deployment:
- [ ] AWS account within 12 months
- [ ] Free tier eligibility confirmed
- [ ] Key pair created
- [ ] Git repository ready
- [ ] S3 bucket created

### During Deployment:
- [ ] Use t2.micro instances only
- [ ] Single instance setup
- [ ] Minimal backup retention
- [ ] Monitor resource creation

### After Deployment:
- [ ] Set up billing alerts
- [ ] Monitor usage in Cost Explorer
- [ ] Test application functionality
- [ ] Document resource usage

## 🚨 Free Tier Warnings

### ⚠️ **Important Notes:**
1. **Free tier expires** after 12 months
2. **Usage beyond limits** incurs charges
3. **Some services** may not be free tier eligible
4. **Data transfer** can quickly exceed 1 GB
5. **Storage** can exceed 5 GB with videos

### 🛡️ **Protection Measures:**
1. **Set up billing alerts** immediately
2. **Monitor usage** daily
3. **Use AWS Cost Explorer** regularly
4. **Implement usage limits** in code
5. **Regular cleanup** of unused resources

## 🎉 Free Tier Benefits

### ✅ **What You Get:**
- **Complete YouTube clone** running on AWS
- **Production-ready architecture** (scaled down)
- **Real AWS experience** with free resources
- **Learning opportunity** without costs
- **Portfolio project** with cloud deployment

### 🚀 **Next Steps:**
1. **Deploy the free tier infrastructure**
2. **Test your application thoroughly**
3. **Monitor usage and costs**
4. **Learn AWS services and best practices**
5. **Plan for paid tier upgrade** when needed

This free tier setup gives you a **complete, production-ready YouTube clone** running on AWS at **zero cost** for 12 months! 🎉


