# Quick Start Guide - Deployment Ready

## 🎯 What Changed?

Your SevaSetu project is now ready for deployment with:
- ✅ AWS Bedrock (Claude 3.5 Sonnet) instead of Groq
- ✅ CORS configured for Vercel deployments
- ✅ Environment variables for all configuration
- ✅ Stable SQLite database path for Docker
- ✅ Backend runs on 0.0.0.0:8000
- ✅ Frontend uses environment variable for API URL

## 🚀 Deploy Backend to AWS EC2

### 1. Launch EC2 Instance
- Ubuntu 22.04 or Amazon Linux 2023
- t3.medium or larger
- Security Group: Allow port 8000

### 2. SSH into EC2 and Install Docker
```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io git
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Amazon Linux
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -aG docker ec2-user

# Log out and back in for group changes
```

### 3. Clone and Configure
```bash
git clone <your-repo-url> ~/sevasetu
cd ~/sevasetu/backend

# Create .env file
cp .env.example .env
nano .env  # Edit with your configuration
```

Required in `.env`:
```bash
SECRET_KEY=<generate-with: python -c "import secrets; print(secrets.token_hex(32))">
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

**IMPORTANT**: Do NOT add AWS credentials. The app uses the EC2 instance's IAM role.

### 4. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Get Your Public IP
```bash
curl http://checkip.amazonaws.com
```

Your backend is now at: `http://<PUBLIC_IP>:8000`

## 🌐 Deploy Frontend to Vercel

### Option 1: Vercel CLI
```bash
cd frontend

# Update .env with your EC2 IP
echo "VITE_API_BASE_URL=http://<EC2_PUBLIC_IP>:8000/api/v1" > .env

# Deploy
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: Vercel Dashboard
1. Push code to GitHub
2. Import project in Vercel
3. Set root directory: `frontend`
4. Add environment variable:
   - `VITE_API_BASE_URL` = `http://<EC2_PUBLIC_IP>:8000/api/v1`
5. Deploy

## 🔐 AWS Bedrock Setup

### Create IAM Role for EC2 (Secure - No Hardcoded Keys!)

1. Go to AWS IAM Console → Roles → Create Role
2. Select "AWS service" → "EC2"
3. Create custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

4. Name: `SevaSetu-Bedrock-Role`
5. Attach to your EC2 instance:
   - EC2 Console → Select instance → Actions → Security → Modify IAM role

### Enable Model Access
1. Go to AWS Bedrock Console
2. Click "Model access" in left sidebar
3. Click "Manage model access"
4. Enable "Claude 3.5 Sonnet v2"
5. Submit (approval is usually instant)

### Verify
```bash
# SSH into EC2
aws sts get-caller-identity
# Should show your instance role
```

## ✅ Verify Deployment

### Test Backend
```bash
# Health check
curl http://<EC2_PUBLIC_IP>:8000/api/v1/health

# Should return: {"status":"healthy"}
```

### Test Frontend
1. Visit your Vercel URL
2. Try the chat feature
3. Check browser console for errors

## 📁 Files Modified

### Backend
- `requirements.txt` - Added boto3, removed groq
- `app/core/config.py` - AWS Bedrock config
- `app/main.py` - CORS for Vercel
- `app/services/ai_service.py` - Bedrock integration
- `.env.example` - Updated variables

### Frontend
- `src/components/ChatPanel.tsx` - No hardcoded URLs
- `.env` - Created with placeholder
- `.env.example` - Updated for production

### Docker
- `docker-compose.yml` - AWS Bedrock env vars
- `Dockerfile` (both) - Already correct ✅

## 🔧 Troubleshooting

### Backend won't start
```bash
docker logs sevasetu-backend
```
Common issues:
- Missing AWS credentials
- Bedrock model not enabled
- Port 8000 in use

### Frontend can't reach backend
- Check EC2 security group allows port 8000
- Verify `VITE_API_BASE_URL` is correct
- Test: `curl http://<EC2_IP>:8000/api/v1/health`

### Bedrock errors
- Verify model access enabled
- Check IAM role attached to EC2
- Verify IAM role has `bedrock:InvokeModel` permission
- Verify region matches
- Test: `aws sts get-caller-identity`

## 📚 Full Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHANGES.md` - Detailed change log

## 💰 Estimated Costs

- EC2 t3.medium: ~$30/month
- Bedrock Claude 3.5: $3-15 per million tokens
- Vercel: Free tier available

## 🆘 Need Help?

1. Check logs: `docker logs sevasetu-backend`
2. Review `DEPLOYMENT.md` for detailed steps
3. Check AWS CloudWatch for Bedrock errors
