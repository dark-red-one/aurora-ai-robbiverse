#!/usr/bin/env python3
import os
import shutil
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StorageMonitor")

def check_storage():
    """Monitor storage usage and clean up when needed"""
    while True:
        try:
            # Check disk usage
            total, used, free = shutil.disk_usage("/app")
            usage_percent = (used / total) * 100
            
            logger.info(f"Storage: {usage_percent:.1f}% used ({used//1024//1024//1024}GB / {total//1024//1024//1024}GB)")
            
            # Alert at 80%
            if usage_percent > 80:
                logger.warning(f"🚨 Storage at {usage_percent:.1f}% - cleanup recommended")
                
            # Automatic cleanup at 90%
            if usage_percent > 90:
                logger.error(f"🚨 Storage critical at {usage_percent:.1f}% - starting cleanup")
                cleanup_storage()
                
        except Exception as e:
            logger.error(f"Storage check failed: {e}")
            
        time.sleep(300)  # Check every 5 minutes

def cleanup_storage():
    """Clean up temporary files and logs"""
    cleanup_dirs = ["/app/logs", "/app/tmp", "/var/log"]
    
    for dir_path in cleanup_dirs:
        if os.path.exists(dir_path):
            for root, dirs, files in os.walk(dir_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        # Delete files older than 7 days
                        if os.path.getmtime(file_path) < time.time() - 7 * 24 * 3600:
                            os.remove(file_path)
                            logger.info(f"Cleaned up: {file_path}")
                    except Exception as e:
                        logger.error(f"Failed to clean {file_path}: {e}")

if __name__ == "__main__":
    check_storage()
