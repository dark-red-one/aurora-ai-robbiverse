#!/usr/bin/env python3
"""
GPU Mesh Service - Systemd-ready service with automatic recovery
"""
import asyncio
import aiohttp
import logging
import subprocess
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/gpu-mesh.log')
    ]
)
logger = logging.getLogger('gpu_mesh')

class GPUMeshService:
    def __init__(self):
        self.endpoints = {
            'local': {'url': 'http://localhost:11434', 'status': 'unknown', 'failures': 0},
            'tunnel': {'url': 'http://localhost:8080', 'status': 'unknown', 'failures': 0},
            'runpod': {'url': 'http://localhost:8081', 'status': 'unknown', 'failures': 0}
        }
        self.check_interval = 30
        self.session = None
        
    async def start(self):
        logger.info("🚀 GPU Mesh Service Starting...")
        timeout = aiohttp.ClientTimeout(total=10)
        self.session = aiohttp.ClientSession(timeout=timeout)
        
        try:
            await asyncio.gather(
                self.monitor_loop(),
                self.stats_loop()
            )
        finally:
            await self.session.close()
    
    async def monitor_loop(self):
        while True:
            try:
                for name, ep in self.endpoints.items():
                    await self.check_endpoint(name, ep)
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Monitor error: {e}")
                await asyncio.sleep(5)
    
    async def check_endpoint(self, name, ep):
        try:
            async with self.session.get(f"{ep['url']}/api/tags") as resp:
                if resp.status == 200:
                    if ep['status'] != 'healthy':
                        logger.info(f"✅ {name} is healthy")
                    ep['status'] = 'healthy'
                    ep['failures'] = 0
                else:
                    self.mark_unhealthy(name, ep, f"HTTP {resp.status}")
        except Exception as e:
            self.mark_unhealthy(name, ep, str(e))
    
    def mark_unhealthy(self, name, ep, reason):
        ep['failures'] += 1
        if ep['failures'] == 1:
            logger.warning(f"⚠️  {name} unhealthy: {reason}")
        ep['status'] = 'unhealthy'
        
        if ep['failures'] >= 3 and name == 'local':
            logger.error(f"🔧 Attempting to restart {name}")
            self.restart_local_ollama()
    
    def restart_local_ollama(self):
        try:
            subprocess.run(['pkill', '-f', 'ollama serve'], check=False)
            subprocess.Popen(['ollama', 'serve'], 
                           stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL)
            logger.info("✅ Local Ollama restarted")
        except Exception as e:
            logger.error(f"❌ Restart failed: {e}")
    
    async def stats_loop(self):
        await asyncio.sleep(60)
        while True:
            try:
                logger.info("=" * 50)
                for name, ep in self.endpoints.items():
                    icon = "🟢" if ep['status'] == 'healthy' else "🔴"
                    logger.info(f"{icon} {name:10s} | {ep['status']:10s} | Failures: {ep['failures']}")
                logger.info("=" * 50)
                await asyncio.sleep(300)
            except Exception as e:
                logger.error(f"Stats error: {e}")
                await asyncio.sleep(60)

async def main():
    service = GPUMeshService()
    try:
        await service.start()
    except KeyboardInterrupt:
        logger.info("👋 Shutting down...")

if __name__ == "__main__":
    asyncio.run(main())
