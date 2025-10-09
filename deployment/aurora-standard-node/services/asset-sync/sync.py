#!/usr/bin/env python3
"""
Aurora Asset Sync Service
Syncs static assets (images, PNGs, etc.) from origin (MinIO/S3) to local cache
"""

import os
import time
import json
import hashlib
import logging
from pathlib import Path
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('asset-sync')

# Configuration from environment
ORIGIN_URL = os.getenv('ORIGIN_URL', 'http://10.0.0.1:9000')
ORIGIN_ACCESS_KEY = os.getenv('ORIGIN_ACCESS_KEY', 'aurora_admin')
ORIGIN_SECRET_KEY = os.getenv('ORIGIN_SECRET_KEY', 'aurora_secret')
LOCAL_PATH = Path(os.getenv('LOCAL_PATH', '/assets'))
SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL', '300'))  # 5 minutes
NODE_NAME = os.getenv('NODE_NAME', 'unknown')
BUCKET_NAME = 'aurora-assets'

# Statistics
stats = {
    'last_sync': None,
    'files_synced': 0,
    'bytes_synced': 0,
    'errors': 0,
    'sync_duration': 0
}

def get_s3_client():
    """Create S3 client for MinIO"""
    try:
        # Extract host from URL
        host = ORIGIN_URL.replace('http://', '').replace('https://', '')
        
        client = boto3.client(
            's3',
            endpoint_url=ORIGIN_URL,
            aws_access_key_id=ORIGIN_ACCESS_KEY,
            aws_secret_access_key=ORIGIN_SECRET_KEY,
            region_name='us-east-1',  # MinIO doesn't care about region
            verify=False  # For self-signed certs
        )
        return client
    except Exception as e:
        logger.error(f"Failed to create S3 client: {e}")
        return None

def get_file_hash(filepath):
    """Calculate MD5 hash of local file"""
    try:
        md5 = hashlib.md5()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                md5.update(chunk)
        return md5.hexdigest()
    except Exception as e:
        logger.error(f"Failed to hash {filepath}: {e}")
        return None

def download_file(s3_client, key, local_path):
    """Download file from S3/MinIO to local path"""
    try:
        # Create parent directories
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Download file
        s3_client.download_file(BUCKET_NAME, key, str(local_path))
        logger.info(f"Downloaded: {key} -> {local_path}")
        return True
    except ClientError as e:
        logger.error(f"Failed to download {key}: {e}")
        stats['errors'] += 1
        return False

def sync_assets():
    """Main sync logic - pulls assets from origin"""
    logger.info(f"Starting asset sync from {ORIGIN_URL}/{BUCKET_NAME}")
    start_time = time.time()
    
    s3_client = get_s3_client()
    if not s3_client:
        logger.error("Cannot sync without S3 client")
        stats['errors'] += 1
        return
    
    try:
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=BUCKET_NAME)
        except ClientError:
            logger.warning(f"Bucket {BUCKET_NAME} doesn't exist yet, skipping sync")
            return
        
        # List all objects in bucket
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=BUCKET_NAME)
        
        files_checked = 0
        files_downloaded = 0
        bytes_downloaded = 0
        
        for page in pages:
            if 'Contents' not in page:
                continue
                
            for obj in page['Contents']:
                key = obj['Key']
                size = obj['Size']
                etag = obj['ETag'].strip('"')
                
                files_checked += 1
                
                # Determine local path
                local_file = LOCAL_PATH / key
                
                # Check if file exists and matches
                need_download = True
                if local_file.exists():
                    local_hash = get_file_hash(local_file)
                    if local_hash == etag:
                        need_download = False
                        logger.debug(f"Skipping {key} (unchanged)")
                
                # Download if needed
                if need_download:
                    if download_file(s3_client, key, local_file):
                        files_downloaded += 1
                        bytes_downloaded += size
        
        # Update statistics
        stats['last_sync'] = datetime.utcnow().isoformat()
        stats['files_synced'] = files_downloaded
        stats['bytes_synced'] = bytes_downloaded
        stats['sync_duration'] = time.time() - start_time
        
        logger.info(f"Sync complete: {files_checked} files checked, {files_downloaded} downloaded, {bytes_downloaded / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        stats['errors'] += 1

def write_status():
    """Write sync status to file for health checks"""
    status_file = LOCAL_PATH / '.sync_status'
    try:
        with open(status_file, 'w') as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write status: {e}")

def main():
    """Main service loop"""
    logger.info(f"Aurora Asset Sync Service starting on node: {NODE_NAME}")
    logger.info(f"Origin: {ORIGIN_URL}/{BUCKET_NAME}")
    logger.info(f"Local path: {LOCAL_PATH}")
    logger.info(f"Sync interval: {SYNC_INTERVAL}s")
    
    # Ensure local path exists
    LOCAL_PATH.mkdir(parents=True, exist_ok=True)
    
    # Initial sync
    logger.info("Running initial sync...")
    sync_assets()
    write_status()
    
    # Continuous sync loop
    while True:
        try:
            time.sleep(SYNC_INTERVAL)
            logger.info("Running scheduled sync...")
            sync_assets()
            write_status()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            stats['errors'] += 1
            time.sleep(60)  # Wait before retrying

if __name__ == '__main__':
    main()
