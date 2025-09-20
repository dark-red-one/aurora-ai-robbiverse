#!/usr/bin/env python3
"""
Aurora AI Empire - Disk Space Management System
Handles disk space monitoring, cleanup, and expansion strategies
"""

import os
import shutil
import subprocess
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiskSpaceManager:
    def __init__(self):
        self.aurora_path = "/workspace/aurora"
        self.cleanup_threshold = 80  # Start cleanup at 80% usage
        self.critical_threshold = 90  # Critical at 90% usage
        self.cleanup_strategies = {
            "logs": self.cleanup_logs,
            "temp_files": self.cleanup_temp_files,
            "old_backups": self.cleanup_old_backups,
            "docker_images": self.cleanup_docker_images,
            "node_modules": self.cleanup_node_modules,
            "cache_files": self.cleanup_cache_files
        }
        
    def get_disk_usage(self) -> Dict:
        """Get comprehensive disk usage information"""
        try:
            # Get overall disk usage
            disk_usage = psutil.disk_usage(self.aurora_path)
            
            # Get Aurora directory usage
            aurora_size = self.get_directory_size(self.aurora_path)
            
            # Get detailed breakdown
            breakdown = self.get_directory_breakdown(self.aurora_path)
            
            return {
                "total_space_gb": disk_usage.total / (1024**3),
                "used_space_gb": disk_usage.used / (1024**3),
                "free_space_gb": disk_usage.free / (1024**3),
                "usage_percent": (disk_usage.used / disk_usage.total) * 100,
                "aurora_size_gb": aurora_size / (1024**3),
                "breakdown": breakdown,
                "status": self.get_usage_status(disk_usage),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting disk usage: {e}")
            return {"error": str(e)}
    
    def get_directory_size(self, path: str) -> int:
        """Get total size of directory in bytes"""
        total_size = 0
        try:
            for dirpath, dirnames, filenames in os.walk(path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    if os.path.exists(filepath):
                        total_size += os.path.getsize(filepath)
        except Exception as e:
            logger.error(f"Error calculating directory size: {e}")
        return total_size
    
    def get_directory_breakdown(self, path: str) -> Dict:
        """Get detailed breakdown of directory sizes"""
        breakdown = {}
        try:
            for item in os.listdir(path):
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    size = self.get_directory_size(item_path)
                    breakdown[item] = {
                        "size_bytes": size,
                        "size_mb": size / (1024**2),
                        "size_gb": size / (1024**3),
                        "type": "directory"
                    }
                else:
                    size = os.path.getsize(item_path)
                    breakdown[item] = {
                        "size_bytes": size,
                        "size_mb": size / (1024**2),
                        "size_gb": size / (1024**3),
                        "type": "file"
                    }
        except Exception as e:
            logger.error(f"Error getting directory breakdown: {e}")
        
        return breakdown
    
    def get_usage_status(self, disk_usage) -> str:
        """Get usage status based on thresholds"""
        usage_percent = (disk_usage.used / disk_usage.total) * 100
        
        if usage_percent >= self.critical_threshold:
            return "critical"
        elif usage_percent >= self.cleanup_threshold:
            return "warning"
        else:
            return "healthy"
    
    def cleanup_logs(self) -> Dict:
        """Clean up old log files"""
        cleaned_files = []
        freed_space = 0
        
        try:
            log_dirs = [
                "/var/log/aurora",
                "/workspace/aurora/logs",
                "/tmp"
            ]
            
            for log_dir in log_dirs:
                if os.path.exists(log_dir):
                    for file in os.listdir(log_dir):
                        if file.endswith('.log'):
                            file_path = os.path.join(log_dir, file)
                            if os.path.isfile(file_path):
                                # Keep only last 7 days of logs
                                file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(file_path))
                                if file_age.days > 7:
                                    size = os.path.getsize(file_path)
                                    os.remove(file_path)
                                    cleaned_files.append(file_path)
                                    freed_space += size
                                    
        except Exception as e:
            logger.error(f"Error cleaning logs: {e}")
        
        return {
            "strategy": "logs",
            "cleaned_files": len(cleaned_files),
            "freed_space_mb": freed_space / (1024**2),
            "status": "completed"
        }
    
    def cleanup_temp_files(self) -> Dict:
        """Clean up temporary files"""
        cleaned_files = []
        freed_space = 0
        
        try:
            temp_dirs = [
                "/tmp",
                "/workspace/aurora/tmp",
                "/workspace/aurora/uploads"
            ]
            
            for temp_dir in temp_dirs:
                if os.path.exists(temp_dir):
                    for file in os.listdir(temp_dir):
                        file_path = os.path.join(temp_dir, file)
                        if os.path.isfile(file_path):
                            # Clean files older than 1 day
                            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(file_path))
                            if file_age.days > 1:
                                size = os.path.getsize(file_path)
                                os.remove(file_path)
                                cleaned_files.append(file_path)
                                freed_space += size
                                
        except Exception as e:
            logger.error(f"Error cleaning temp files: {e}")
        
        return {
            "strategy": "temp_files",
            "cleaned_files": len(cleaned_files),
            "freed_space_mb": freed_space / (1024**2),
            "status": "completed"
        }
    
    def cleanup_old_backups(self) -> Dict:
        """Clean up old backup files"""
        cleaned_files = []
        freed_space = 0
        
        try:
            backup_dirs = [
                "/workspace/aurora/backups",
                "/var/backups/aurora"
            ]
            
            for backup_dir in backup_dirs:
                if os.path.exists(backup_dir):
                    for file in os.listdir(backup_dir):
                        if file.endswith(('.tar.gz', '.sql', '.backup')):
                            file_path = os.path.join(backup_dir, file)
                            if os.path.isfile(file_path):
                                # Keep only last 30 days of backups
                                file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(file_path))
                                if file_age.days > 30:
                                    size = os.path.getsize(file_path)
                                    os.remove(file_path)
                                    cleaned_files.append(file_path)
                                    freed_space += size
                                    
        except Exception as e:
            logger.error(f"Error cleaning old backups: {e}")
        
        return {
            "strategy": "old_backups",
            "cleaned_files": len(cleaned_files),
            "freed_space_mb": freed_space / (1024**2),
            "status": "completed"
        }
    
    def cleanup_docker_images(self) -> Dict:
        """Clean up unused Docker images"""
        try:
            # Remove unused Docker images
            result = subprocess.run(
                ["docker", "system", "prune", "-f"],
                capture_output=True, text=True, timeout=60
            )
            
            if result.returncode == 0:
                return {
                    "strategy": "docker_images",
                    "cleaned_files": "Docker images",
                    "freed_space_mb": "Unknown",
                    "status": "completed"
                }
            else:
                return {
                    "strategy": "docker_images",
                    "cleaned_files": 0,
                    "freed_space_mb": 0,
                    "status": "failed",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"Error cleaning Docker images: {e}")
            return {
                "strategy": "docker_images",
                "cleaned_files": 0,
                "freed_space_mb": 0,
                "status": "failed",
                "error": str(e)
            }
    
    def cleanup_node_modules(self) -> Dict:
        """Clean up node_modules directories (can be regenerated)"""
        cleaned_dirs = []
        freed_space = 0
        
        try:
            for root, dirs, files in os.walk(self.aurora_path):
                if 'node_modules' in dirs:
                    node_modules_path = os.path.join(root, 'node_modules')
                    size = self.get_directory_size(node_modules_path)
                    shutil.rmtree(node_modules_path)
                    cleaned_dirs.append(node_modules_path)
                    freed_space += size
                    
        except Exception as e:
            logger.error(f"Error cleaning node_modules: {e}")
        
        return {
            "strategy": "node_modules",
            "cleaned_files": len(cleaned_dirs),
            "freed_space_mb": freed_space / (1024**2),
            "status": "completed"
        }
    
    def cleanup_cache_files(self) -> Dict:
        """Clean up cache files"""
        cleaned_files = []
        freed_space = 0
        
        try:
            cache_dirs = [
                "/workspace/aurora/.cache",
                "/workspace/aurora/cache",
                "/tmp/.cache"
            ]
            
            for cache_dir in cache_dirs:
                if os.path.exists(cache_dir):
                    for file in os.listdir(cache_dir):
                        file_path = os.path.join(cache_dir, file)
                        if os.path.isfile(file_path):
                            size = os.path.getsize(file_path)
                            os.remove(file_path)
                            cleaned_files.append(file_path)
                            freed_space += size
                            
        except Exception as e:
            logger.error(f"Error cleaning cache files: {e}")
        
        return {
            "strategy": "cache_files",
            "cleaned_files": len(cleaned_files),
            "freed_space_mb": freed_space / (1024**2),
            "status": "completed"
        }
    
    def auto_cleanup(self) -> Dict:
        """Perform automatic cleanup based on usage"""
        usage_info = self.get_disk_usage()
        
        if usage_info.get("status") == "healthy":
            return {"status": "no_cleanup_needed", "usage_percent": usage_info["usage_percent"]}
        
        logger.info(f"🚨 Disk usage at {usage_info['usage_percent']:.1f}% - starting cleanup...")
        
        cleanup_results = []
        total_freed = 0
        
        # Run cleanup strategies in order of safety
        safe_strategies = ["logs", "temp_files", "cache_files", "old_backups", "docker_images", "node_modules"]
        
        for strategy in safe_strategies:
            if strategy in self.cleanup_strategies:
                result = self.cleanup_strategies[strategy]()
                cleanup_results.append(result)
                total_freed += result.get("freed_space_mb", 0)
                
                # Check if we've freed enough space
                new_usage = self.get_disk_usage()
                if new_usage.get("usage_percent", 100) < self.cleanup_threshold:
                    logger.info(f"✅ Cleanup successful - usage now at {new_usage['usage_percent']:.1f}%")
                    break
        
        return {
            "status": "cleanup_completed",
            "strategies_used": len(cleanup_results),
            "total_freed_mb": total_freed,
            "results": cleanup_results
        }
    
    def get_expansion_recommendations(self) -> Dict:
        """Get recommendations for disk space expansion"""
        usage_info = self.get_disk_usage()
        
        recommendations = []
        
        if usage_info.get("usage_percent", 0) > 80:
            recommendations.append({
                "priority": "high",
                "action": "immediate_cleanup",
                "description": "Disk usage is above 80% - perform immediate cleanup"
            })
        
        if usage_info.get("usage_percent", 0) > 90:
            recommendations.append({
                "priority": "critical",
                "action": "emergency_cleanup",
                "description": "Disk usage is above 90% - emergency cleanup required"
            })
        
        # RunPod specific recommendations
        recommendations.append({
            "priority": "medium",
            "action": "runpod_volume_expansion",
            "description": "Consider upgrading RunPod volume size (20GB -> 50GB or 100GB)"
        })
        
        recommendations.append({
            "priority": "low",
            "action": "distributed_storage",
            "description": "Implement distributed storage across multiple RunPods"
        })
        
        recommendations.append({
            "priority": "low",
            "action": "cloud_storage",
            "description": "Set up cloud storage integration (AWS S3, Google Cloud Storage)"
        })
        
        return {
            "current_usage_percent": usage_info.get("usage_percent", 0),
            "recommendations": recommendations,
            "immediate_actions": [r for r in recommendations if r["priority"] in ["high", "critical"]],
            "long_term_actions": [r for r in recommendations if r["priority"] == "low"]
        }
    
    async def start_disk_manager(self):
        """Start the disk space management service"""
        logger.info("💾 Starting Aurora Disk Space Manager...")
        logger.info("🧹 Automatic cleanup and monitoring enabled...")
        
        # Start web server for disk management API
        from fastapi import FastAPI
        import uvicorn
        
        app = FastAPI(title="Aurora Disk Space Manager")
        
        @app.get("/disk/usage")
        async def get_usage():
            return self.get_disk_usage()
        
        @app.get("/disk/breakdown")
        async def get_breakdown():
            return self.get_directory_breakdown(self.aurora_path)
        
        @app.post("/disk/cleanup")
        async def cleanup():
            return self.auto_cleanup()
        
        @app.get("/disk/recommendations")
        async def get_recommendations():
            return self.get_expansion_recommendations()
        
        @app.get("/disk/health")
        async def health_check():
            usage = self.get_disk_usage()
            return {
                "status": "healthy" if usage.get("status") == "healthy" else "warning",
                "usage_percent": usage.get("usage_percent", 0),
                "free_space_gb": usage.get("free_space_gb", 0)
            }
        
        # Start the disk manager
        logger.info("✅ Disk Space Manager started!")
        logger.info("🌐 Disk Manager API available at http://localhost:8003")
        
        # Run the web server
        config = uvicorn.Config(app, host="0.0.0.0", port=8003, log_level="info")
        server = uvicorn.Server(config)
        await server.serve()

if __name__ == "__main__":
    import asyncio
    manager = DiskSpaceManager()
    asyncio.run(manager.start_disk_manager())
