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
