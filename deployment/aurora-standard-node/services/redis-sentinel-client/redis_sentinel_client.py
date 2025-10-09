#!/usr/bin/env python3
"""
Redis Sentinel Client
Automatically discovers Redis master via Sentinel and handles failover
"""

import redis
import redis.sentinel
import logging
from typing import Optional, List, Dict
import os

logger = logging.getLogger(__name__)

class RedisSentinelClient:
    """Redis client that automatically handles Sentinel discovery and failover"""
    
    def __init__(self, 
                 sentinel_hosts: List[str] = None,
                 master_name: str = "aurora-redis",
                 password: str = None,
                 db: int = 0):
        
        self.sentinel_hosts = sentinel_hosts or [
            "172.20.0.11:26379",  # Aurora sentinel
            "10.0.0.2:26379",     # Star sentinel
            "10.0.0.10:26379"     # Vengeance sentinel
        ]
        self.master_name = master_name
        self.password = password
        self.db = db
        self.sentinel = None
        self.master = None
        self.slave = None
        
        self._connect()
    
    def _connect(self):
        """Connect to Redis via Sentinel"""
        try:
            # Create Sentinel connection
            self.sentinel = redis.sentinel.Sentinel(
                [(host.split(':')[0], int(host.split(':')[1])) 
                 for host in self.sentinel_hosts],
                password=self.password,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True
            )
            
            # Get master connection
            self.master = self.sentinel.master_for(
                self.master_name,
                password=self.password,
                db=self.db,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True
            )
            
            # Get slave connection (for read operations)
            self.slave = self.sentinel.slave_for(
                self.master_name,
                password=self.password,
                db=self.db,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True
            )
            
            logger.info(f"✅ Connected to Redis via Sentinel: {self.master_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis via Sentinel: {e}")
            raise
    
    def get_master(self) -> redis.Redis:
        """Get master Redis connection (for writes)"""
        if not self.master:
            self._connect()
        return self.master
    
    def get_slave(self) -> redis.Redis:
        """Get slave Redis connection (for reads)"""
        if not self.slave:
            self._connect()
        return self.slave
    
    def get_connection(self, read_only: bool = False) -> redis.Redis:
        """Get appropriate Redis connection based on operation type"""
        if read_only and self.slave:
            return self.slave
        return self.get_master()
    
    def ping(self) -> bool:
        """Test Redis connection"""
        try:
            return self.get_master().ping()
        except Exception as e:
            logger.error(f"❌ Redis ping failed: {e}")
            return False
    
    def get_master_info(self) -> Dict:
        """Get current master information"""
        try:
            masters = self.sentinel.masters()
            return masters.get(self.master_name, {})
        except Exception as e:
            logger.error(f"❌ Failed to get master info: {e}")
            return {}
    
    def get_sentinels_info(self) -> List[Dict]:
        """Get all sentinels information"""
        try:
            return self.sentinel.sentinels(self.master_name)
        except Exception as e:
            logger.error(f"❌ Failed to get sentinels info: {e}")
            return []


# Convenience functions for easy integration
def get_redis_client(read_only: bool = False) -> redis.Redis:
    """Get Redis client with automatic Sentinel discovery"""
    password = os.getenv("REDIS_PASSWORD")
    client = RedisSentinelClient(password=password)
    return client.get_connection(read_only=read_only)


def get_redis_master() -> redis.Redis:
    """Get Redis master connection (for writes)"""
    return get_redis_client(read_only=False)


def get_redis_slave() -> redis.Redis:
    """Get Redis slave connection (for reads)"""
    return get_redis_client(read_only=True)


# Example usage
if __name__ == "__main__":
    # Test connection
    client = RedisSentinelClient()
    
    if client.ping():
        print("✅ Redis Sentinel connection successful")
        
        # Test write
        client.get_master().set("test_key", "test_value")
        
        # Test read
        value = client.get_slave().get("test_key")
        print(f"Read value: {value}")
        
        # Show master info
        master_info = client.get_master_info()
        print(f"Master info: {master_info}")
        
    else:
        print("❌ Redis Sentinel connection failed")
