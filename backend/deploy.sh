#!/bin/bash
# SevaSetu Backend Deployment Script for AWS EC2

set -e

echo "🚀 SevaSetu Backend Deployment"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with required variables:"
    echo "  - SECRET_KEY"
    echo "  - AWS_REGION"
    echo "  - BEDROCK_MODEL_ID"
    echo ""
    echo "NOTE: Do NOT add AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY"
    echo "The application uses the EC2 instance's IAM role for authentication."
    echo ""
    echo "You can copy from .env.example:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Edit with your values"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "Please install Docker first:"
    echo "  Ubuntu: sudo apt-get install docker.io"
    echo "  Amazon Linux: sudo yum install docker"
    exit 1
fi

# Verify IAM role is attached (optional check)
echo "🔐 Checking IAM role..."
if command -v aws &> /dev/null; then
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ IAM role detected"
        aws sts get-caller-identity | grep Arn
    else
        echo "⚠️  Warning: Could not verify IAM role"
        echo "Make sure your EC2 instance has an IAM role with bedrock:InvokeModel permission"
    fi
else
    echo "⚠️  AWS CLI not installed - skipping IAM role check"
    echo "Make sure your EC2 instance has an IAM role with bedrock:InvokeModel permission"
fi

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=sevasetu-backend)" ]; then
    echo "🛑 Stopping existing container..."
    docker stop sevasetu-backend || true
    docker rm sevasetu-backend || true
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t sevasetu-backend .

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name sevasetu-backend \
  -p 8000:8000 \
  --env-file .env \
  -v sevasetu-data:/app/data \
  --restart unless-stopped \
  sevasetu-backend

# Wait a few seconds for the container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Check if container is running
if [ "$(docker ps -q -f name=sevasetu-backend)" ]; then
    echo "✅ Container is running!"
    echo ""
    echo "📊 Container status:"
    docker ps -f name=sevasetu-backend
    echo ""
    echo "📝 View logs:"
    echo "  docker logs -f sevasetu-backend"
    echo ""
    echo "🔍 Test health endpoint:"
    echo "  curl http://localhost:8000/api/v1/health"
    echo ""
    echo "🌐 Get your public IP:"
    echo "  curl http://checkip.amazonaws.com"
    echo ""
    echo "Your backend will be accessible at: http://<PUBLIC_IP>:8000"
else
    echo "❌ Error: Container failed to start!"
    echo "Check logs with: docker logs sevasetu-backend"
    exit 1
fi
