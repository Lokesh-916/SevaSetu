# SevaSetu Deployment Guide

This guide covers deploying SevaSetu with the following architecture:
- **Frontend**: Vercel
- **Backend**: AWS EC2 (Docker container)
- **LLM**: AWS Bedrock (Claude 3.5 Sonnet)
- **Database**: SQLite (for demo purposes)

## Prerequisites

1. AWS Account with:
   - EC2 access
   - Bedrock access (Claude 3.5 Sonnet enabled in your region)
   - IAM credentials with appropriate permissions

2. Vercel account

3. Docker installed on your EC2 instance

## Backend Deployment (AWS EC2)

### 1. Launch EC2 Instance

- Choose Ubuntu 22.04 LTS or Amazon Linux 2023
- Instance type: t3.medium or larger (for ML models)
- Storage: At least 20GB
- Security Group: Allow inbound traffic on port 8000

### 2. Install Docker on EC2

```bash
# For Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# For Amazon Linux
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -aG docker ec2-user
```

### 3. Configure Environment Variables

Create `/home/ubuntu/sevasetu/backend/.env`:

```bash
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<generate-with-python-secrets-token-hex-32>

# Database (stable path for Docker volume)
DATABASE_URL=sqlite+aiosqlite:////app/data/sevasetu.db

# AWS Bedrock (NO credentials needed - uses IAM role)
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

**IMPORTANT**: Do NOT add AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY. The application uses the EC2 instance's IAM role for authentication.

### 4. Deploy Backend Container

```bash
# Clone repository
git clone <your-repo-url> /home/ubuntu/sevasetu
cd /home/ubuntu/sevasetu

# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values

# Build and run
cd backend
docker build -t sevasetu-backend .
docker run -d \
  --name sevasetu-backend \
  -p 8000:8000 \
  --env-file .env \
  -v sevasetu-data:/app/data \
  --restart unless-stopped \
  sevasetu-backend
```

### 5. Verify Backend

```bash
# Check logs
docker logs sevasetu-backend

# Test health endpoint
curl http://localhost:8000/api/v1/health

# Get your EC2 public IP
curl http://checkip.amazonaws.com
```

Your backend should now be accessible at `http://<EC2_PUBLIC_IP>:8000`

## Frontend Deployment (Vercel)

### 1. Prepare Frontend Configuration

Update `frontend/.env` with your EC2 public IP:

```bash
VITE_API_BASE_URL=http://<EC2_PUBLIC_IP>:8000/api/v1
VITE_APP_NAME=SevaSetu
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

When prompted, set the environment variable:
- `VITE_API_BASE_URL`: `http://<EC2_PUBLIC_IP>:8000/api/v1`

#### Option B: Vercel Dashboard

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set root directory to `frontend`
4. Add environment variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `http://<EC2_PUBLIC_IP>:8000/api/v1`
5. Deploy

### 3. Verify Frontend

Visit your Vercel URL and test the application.

## AWS Bedrock Setup

### 1. Create IAM Role for EC2

**This is the recommended and secure approach - no hardcoded credentials!**

1. Go to AWS IAM Console → Roles → Create Role
2. Select "AWS service" → "EC2"
3. Click "Next"
4. Create a custom policy with this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

5. Name the role: `SevaSetu-Bedrock-Role`
6. Attach this role to your EC2 instance:
   - EC2 Console → Select your instance
   - Actions → Security → Modify IAM role
   - Select `SevaSetu-Bedrock-Role`

### 2. Enable Model Access

1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Request access to "Claude 3.5 Sonnet v2"
4. Wait for approval (usually instant)

### 3. Verify IAM Role

SSH into your EC2 instance and test:

```bash
# Install AWS CLI if not present
sudo apt-get install -y awscli  # Ubuntu
# or
sudo yum install -y aws-cli     # Amazon Linux

# Test credentials (should work without configuring keys)
aws sts get-caller-identity

# Should show your EC2 instance role
```

## Database Considerations

### Current Setup (SQLite)

- Database file: `/app/data/sevasetu.db` (inside Docker volume)
- Suitable for demos and low-traffic applications
- Data persists across container restarts via Docker volume

### Production Considerations

For production with higher traffic, consider:
- Amazon RDS (PostgreSQL)
- Amazon Aurora Serverless
- Update `DATABASE_URL` in `.env` accordingly

## Security Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use HTTPS for production (add SSL/TLS termination)
- [ ] Restrict EC2 security group to only necessary IPs
- [ ] Verify EC2 instance has IAM role attached (no hardcoded AWS credentials)
- [ ] Enable CloudWatch logging for EC2
- [ ] Set up automated backups for SQLite database
- [ ] Consider using AWS Application Load Balancer with SSL
- [ ] Enable rate limiting on backend API
- [ ] Ensure `.env` files are in `.gitignore` (already configured)

## Monitoring

### Backend Logs

```bash
# View real-time logs
docker logs -f sevasetu-backend

# View last 100 lines
docker logs --tail 100 sevasetu-backend
```

### Health Check

```bash
curl http://<EC2_PUBLIC_IP>:8000/api/v1/health
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker logs sevasetu-backend

# Common issues:
# - Missing AWS credentials
# - Invalid DATABASE_URL
# - Port 8000 already in use
```

### Frontend can't reach backend

- Verify EC2 security group allows inbound on port 8000
- Check `VITE_API_BASE_URL` is correct
- Test backend directly: `curl http://<EC2_PUBLIC_IP>:8000/api/v1/health`
- Check CORS configuration in backend

### AWS Bedrock errors

- Verify model access is enabled in Bedrock console
- Check IAM role is attached to EC2 instance
- Verify IAM role has `bedrock:InvokeModel` permission
- Verify region matches (`AWS_REGION`)
- Check CloudWatch logs for detailed errors
- Test IAM role: `aws sts get-caller-identity`

## Updating the Application

### Backend

```bash
cd /home/ubuntu/sevasetu
git pull
cd backend
docker build -t sevasetu-backend .
docker stop sevasetu-backend
docker rm sevasetu-backend
docker run -d \
  --name sevasetu-backend \
  -p 8000:8000 \
  --env-file .env \
  -v sevasetu-data:/app/data \
  --restart unless-stopped \
  sevasetu-backend
```

### Frontend

Vercel automatically redeploys on git push (if connected to GitHub).

Or manually:
```bash
cd frontend
vercel --prod
```

## Cost Estimates

- **EC2 t3.medium**: ~$30/month (on-demand)
- **AWS Bedrock (Claude 3.5 Sonnet)**: Pay per token
  - Input: $3 per million tokens
  - Output: $15 per million tokens
- **Vercel**: Free tier available
- **Data transfer**: Varies by usage

## Support

For issues, check:
1. Backend logs: `docker logs sevasetu-backend`
2. Frontend console (browser DevTools)
3. AWS CloudWatch logs
4. Vercel deployment logs
