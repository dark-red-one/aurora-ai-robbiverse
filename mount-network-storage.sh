#!/bin/bash
# Mount TestPilot Network Storage (4TB) to Aurora pods

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     MOUNTING TESTPILOT-SIMULATIONS 4TB NETWORK STORAGE       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

VOLUME_ID="bguoh9kd1g"
BUCKET_NAME="bguoh9kd1g"
ENDPOINT="https://s3api-eur-is-1.runpod.io"
MOUNT_POINT="/workspace/network-storage"

echo "📊 Network Volume Details:"
echo "   • Name: testpilot-simulations"
echo "   • Size: 4TB (4000 GB)"
echo "   • Location: EUR-IS-1 (Iceland)"
echo "   • Cost: $200/month"
echo "   • Volume ID: $VOLUME_ID"
echo ""

# Method 1: Using S3FS (S3-compatible mount)
echo "═══════════════════════════════════════════════════════════════"
echo "METHOD 1: S3FS Mount (Recommended)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Install s3fs if not present
if ! command -v s3fs &> /dev/null; then
    echo "Installing s3fs..."
    apt-get update && apt-get install -y s3fs
fi

# Create mount point
mkdir -p $MOUNT_POINT

# Setup credentials (you'll need to add your RunPod S3 API credentials)
echo "📝 To mount with s3fs, you need:"
echo "1. Go to RunPod console → Storage → Create S3 API Key"
echo "2. Save the Access Key and Secret Key"
echo "3. Run these commands:"
echo ""
cat << 'EOF'
# Store credentials
echo "ACCESS_KEY:SECRET_KEY" > ~/.passwd-s3fs
chmod 600 ~/.passwd-s3fs

# Mount the volume
s3fs bguoh9kd1g /workspace/network-storage \
  -o passwd_file=~/.passwd-s3fs \
  -o url=https://s3api-eur-is-1.runpod.io \
  -o use_path_request_style \
  -o allow_other

# Verify mount
df -h | grep network-storage
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "METHOD 2: AWS CLI Access"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    apt-get update && apt-get install -y awscli
fi

echo "📝 Configure AWS CLI for RunPod S3:"
cat << 'EOF'
# Configure AWS CLI
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set region eur-is-1

# List files in your volume
aws s3 ls --endpoint-url https://s3api-eur-is-1.runpod.io s3://bguoh9kd1g/

# Upload a file
aws s3 cp myfile.bin --endpoint-url https://s3api-eur-is-1.runpod.io s3://bguoh9kd1g/

# Download a file
aws s3 cp --endpoint-url https://s3api-eur-is-1.runpod.io s3://bguoh9kd1g/myfile.bin ./

# Sync a directory
aws s3 sync /workspace/models --endpoint-url https://s3api-eur-is-1.runpod.io s3://bguoh9kd1g/models/
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "METHOD 3: Python Boto3 Access"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cat > /workspace/aurora/s3-storage-manager.py << 'PYTHONEOF'
#!/usr/bin/env python3
"""
TestPilot Network Storage Manager
Manages 4TB S3-compatible storage
"""

import boto3
import os
from botocore.client import Config

# Configuration
ENDPOINT = "https://s3api-eur-is-1.runpod.io"
BUCKET = "bguoh9kd1g"
ACCESS_KEY = os.getenv("RUNPOD_S3_ACCESS_KEY", "YOUR_ACCESS_KEY")
SECRET_KEY = os.getenv("RUNPOD_S3_SECRET_KEY", "YOUR_SECRET_KEY")

# Create S3 client
s3 = boto3.client(
    's3',
    endpoint_url=ENDPOINT,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name='eur-is-1'
)

def list_files(prefix=""):
    """List files in the network volume"""
    try:
        response = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix)
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"📁 {obj['Key']} - {obj['Size']/1024/1024:.1f}MB")
        else:
            print("📂 Volume is empty")
    except Exception as e:
        print(f"Error: {e}")

def upload_file(local_path, s3_path):
    """Upload file to network storage"""
    try:
        s3.upload_file(local_path, BUCKET, s3_path)
        print(f"✅ Uploaded {local_path} to s3://{BUCKET}/{s3_path}")
    except Exception as e:
        print(f"❌ Upload failed: {e}")

def download_file(s3_path, local_path):
    """Download file from network storage"""
    try:
        s3.download_file(BUCKET, s3_path, local_path)
        print(f"✅ Downloaded s3://{BUCKET}/{s3_path} to {local_path}")
    except Exception as e:
        print(f"❌ Download failed: {e}")

def get_storage_info():
    """Get storage usage info"""
    try:
        response = s3.list_objects_v2(Bucket=BUCKET)
        total_size = 0
        total_files = 0
        
        if 'Contents' in response:
            for obj in response['Contents']:
                total_size += obj['Size']
                total_files += 1
        
        print(f"📊 Storage Statistics:")
        print(f"   • Total Files: {total_files}")
        print(f"   • Used Space: {total_size/1024/1024/1024:.2f} GB")
        print(f"   • Available: {4000 - total_size/1024/1024/1024:.2f} GB")
        print(f"   • Utilization: {(total_size/1024/1024/1024/4000)*100:.1f}%")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("🚀 TestPilot Network Storage Manager")
    print("====================================")
    get_storage_info()
    print("\nFiles in storage:")
    list_files()
PYTHONEOF

chmod +x /workspace/aurora/s3-storage-manager.py

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "QUICK START COMMANDS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣ First, create S3 API credentials in RunPod console"
echo "2️⃣ Then use these commands:"
echo ""
echo "# List your storage"
echo "aws s3 ls --endpoint-url $ENDPOINT s3://$BUCKET/"
echo ""
echo "# Upload a model"
echo "aws s3 cp model.bin --endpoint-url $ENDPOINT s3://$BUCKET/models/"
echo ""
echo "# Download a model"
echo "aws s3 cp --endpoint-url $ENDPOINT s3://$BUCKET/models/model.bin ./"
echo ""
echo "# Sync entire directory"
echo "aws s3 sync /workspace/aurora --endpoint-url $ENDPOINT s3://$BUCKET/aurora/"
echo ""
echo "✅ Network storage setup script ready!"
echo "📝 Next: Get S3 API credentials from RunPod console"
