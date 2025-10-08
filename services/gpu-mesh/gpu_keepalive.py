#!/usr/bin/env python3
"""
GPU Mesh Keepalive Service
Ensures all GPU endpoints stay alive with automatic recovery
"""
import asyncio
import aiohttp
import logging
import subprocess
import time
from datetime import datetime
from typing import Dict, List, Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('gpu_keepalive')

class GPUEndpoint:
    """Represents a GPU endpoint with health monitoring"""
    
    def __init__(self, name: str, url: str, port: int, type: str = "ollama"):
        self.name = name
        self.url = url
        self.port = port
        self.type = type
        self.status = "unknown"
        self.last_success = None
        self.failure_count = 0
        self.total_requests = 0
        self.successful_requests = 0
        
    @property
    def health_url(self) -> str:
        """Get health check URL"""
        if self.type == "ollama":
            return f"{self.url}/api/tags"
        return f"{self.url}/health"
    
    @property
    def uptime_percentage(self) -> float:
        """Calculate uptime percentage"""
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100


class GPUKeepalive:
    """Manages GPU endpoint keepalives and recovery"""
    
    def __init__(self):
        self.endpoints: List[GPUEndpoint] = [
            GPUEndpoint("Local Ollama", "http://localhost:11434", 11434, "ollama"),
            GPUEndpoint("SSH Tunnel GPU", "http://localhost:8080", 8080, "ollama"),
            GPUEndpoint("RunPod GPU", "http://localhost:8081", 8081, "ollama"),
        ]
        self.check_interval = 30  # seconds
        self.recovery_interval = 300  # 5 minutes between recovery attempts
        self.max_failures_before_recovery = 3
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def start(self):
        """Start the keepalive service"""
        logger.info("🚀 GPU Keepalive Service Starting...")
        
        # Create persistent session with keepalive
        timeout = aiohttp.ClientTimeout(total=10, connect=5)
        connector = aiohttp.TCPConnector(
            limit=10,
            limit_per_host=3,
            ttl_dns_cache=300,
            keepalive_timeout=60
        )
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            connector=connector
        )
        
        try:
            # Run health checks in parallel
            await asyncio.gather(
                self.monitor_loop(),
                self.stats_loop(),
                self.recovery_loop()
            )
        finally:
            await self.session.close()
    
    async def monitor_loop(self):
        """Main monitoring loop"""
        logger.info("📊 Starting health monitoring loop...")
        
        while True:
            try:
                # Check all endpoints in parallel
                tasks = [self.check_endpoint(ep) for ep in self.endpoints]
                await asyncio.gather(*tasks, return_exceptions=True)
                
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"❌ Monitor loop error: {e}")
                await asyncio.sleep(5)
    
    async def check_endpoint(self, endpoint: GPUEndpoint):
        """Check a single endpoint health"""
        endpoint.total_requests += 1
        
        try:
            async with self.session.get(endpoint.health_url) as response:
                if response.status == 200:
                    endpoint.status = "healthy"
                    endpoint.last_success = datetime.now()
                    endpoint.failure_count = 0
                    endpoint.successful_requests += 1
                    
                    # Log only on status change
                    if endpoint.failure_count > 0:
                        logger.info(f"✅ {endpoint.name} recovered")
                else:
                    self._mark_unhealthy(endpoint, f"HTTP {response.status}")
                    
        except asyncio.TimeoutError:
            self._mark_unhealthy(endpoint, "timeout")
        except aiohttp.ClientError as e:
            self._mark_unhealthy(endpoint, f"connection error: {type(e).__name__}")
        except Exception as e:
            self._mark_unhealthy(endpoint, f"unexpected error: {e}")
    
    def _mark_unhealthy(self, endpoint: GPUEndpoint, reason: str):
        """Mark endpoint as unhealthy"""
        endpoint.status = "unhealthy"
        endpoint.failure_count += 1
        
        if endpoint.failure_count == 1:  # Log first failure
            logger.warning(f"⚠️  {endpoint.name} unhealthy: {reason}")
        elif endpoint.failure_count >= self.max_failures_before_recovery:
            logger.error(f"🔴 {endpoint.name} FAILED ({endpoint.failure_count} consecutive failures)")
    
    async def recovery_loop(self):
        """Attempt to recover failed endpoints"""
        logger.info("🔧 Starting recovery loop...")
        
        while True:
            try:
                await asyncio.sleep(self.recovery_interval)
                
                for endpoint in self.endpoints:
                    if endpoint.failure_count >= self.max_failures_before_recovery:
                        await self.attempt_recovery(endpoint)
                        
            except Exception as e:
                logger.error(f"❌ Recovery loop error: {e}")
    
    async def attempt_recovery(self, endpoint: GPUEndpoint):
        """Attempt to recover a failed endpoint"""
        logger.info(f"🔧 Attempting recovery for {endpoint.name}...")
        
        if endpoint.name == "Local Ollama":
            await self._recover_local_ollama()
        elif "SSH" in endpoint.name:
            await self._recover_ssh_tunnel(endpoint)
        elif "RunPod" in endpoint.name:
            await self._recover_runpod(endpoint)
    
    async def _recover_local_ollama(self):
        """Recover local Ollama service"""
        try:
            # Check if ollama is running
            result = subprocess.run(
                ["pgrep", "-f", "ollama serve"],
                capture_output=True,
                text=True
            )
            
            if not result.stdout.strip():
                logger.info("🔄 Starting local Ollama...")
                subprocess.Popen(
                    ["ollama", "serve"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True
                )
                await asyncio.sleep(5)  # Wait for startup
                logger.info("✅ Local Ollama started")
            else:
                logger.info("ℹ️  Local Ollama process exists, may need manual intervention")
                
        except Exception as e:
            logger.error(f"❌ Failed to recover local Ollama: {e}")
    
    async def _recover_ssh_tunnel(self, endpoint: GPUEndpoint):
        """Recover SSH tunnel"""
        logger.info(f"ℹ️  SSH tunnel recovery requires manual intervention")
        logger.info(f"   Check: ssh -L {endpoint.port}:localhost:11434 user@remote-host")
    
    async def _recover_runpod(self, endpoint: GPUEndpoint):
        """Recover RunPod connection"""
        logger.info(f"ℹ️  RunPod recovery requires manual intervention")
        logger.info(f"   Check RunPod instance status and SSH tunnel")
    
    async def stats_loop(self):
        """Periodic stats reporting"""
        await asyncio.sleep(60)  # Wait before first report
        
        while True:
            try:
                logger.info("=" * 60)
                logger.info("📊 GPU MESH STATUS REPORT")
                logger.info("=" * 60)
                
                for ep in self.endpoints:
                    status_icon = "🟢" if ep.status == "healthy" else "🔴"
                    uptime = ep.uptime_percentage
                    last_success = ep.last_success.strftime("%H:%M:%S") if ep.last_success else "Never"
                    
                    logger.info(
                        f"{status_icon} {ep.name:20s} | "
                        f"Status: {ep.status:10s} | "
                        f"Uptime: {uptime:5.1f}% | "
                        f"Failures: {ep.failure_count:3d} | "
                        f"Last OK: {last_success}"
                    )
                
                logger.info("=" * 60)
                
                await asyncio.sleep(300)  # Report every 5 minutes
                
            except Exception as e:
                logger.error(f"❌ Stats loop error: {e}")
                await asyncio.sleep(60)
    
    def get_healthy_endpoints(self) -> List[GPUEndpoint]:
        """Get list of currently healthy endpoints"""
        return [ep for ep in self.endpoints if ep.status == "healthy"]
    
    def get_best_endpoint(self) -> Optional[GPUEndpoint]:
        """Get the best available endpoint based on uptime"""
        healthy = self.get_healthy_endpoints()
        if not healthy:
            return None
        return max(healthy, key=lambda ep: ep.uptime_percentage)


async def main():
    """Main entry point"""
    keepalive = GPUKeepalive()
    
    try:
        await keepalive.start()
    except KeyboardInterrupt:
        logger.info("👋 GPU Keepalive Service stopping...")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
