"""
Aurora RobbieVerse - Performance Optimization for M3 Hardware
Maximizes 16-core M3 Max/Pro parallel processing
"""
import asyncio
import multiprocessing
from functools import lru_cache
from typing import Optional
import psutil

class PerformanceConfig:
    """Hardware-optimized performance configuration"""
    
    def __init__(self):
        self.cpu_count = psutil.cpu_count(logical=False)
        self.logical_cpu_count = psutil.cpu_count(logical=True)
        self.total_memory = psutil.virtual_memory().total / (1024 ** 3)  # GB
        
    @property
    def optimal_workers(self) -> int:
        """Calculate optimal number of Uvicorn workers for M3"""
        # For M3 Max with 16 cores, use 12-14 workers (leave 2-4 cores for system)
        return max(1, self.cpu_count - 2)
    
    @property
    def db_pool_size(self) -> int:
        """Optimal database connection pool size"""
        # For remote PostgreSQL, use conservative pool size
        # Most managed PostgreSQL services limit to 20-100 connections
        return min(20, self.optimal_workers * 2)
    
    @property
    def db_max_overflow(self) -> int:
        """Maximum overflow connections"""
        return min(10, self.optimal_workers)
    
    @property
    def async_worker_threads(self) -> int:
        """Threads for async operations"""
        return self.logical_cpu_count
    
    @property
    def cache_size_mb(self) -> int:
        """Optimal cache size based on available memory"""
        # Use 10% of total memory for caching
        return int(self.total_memory * 0.1 * 1024)  # MB
    
    def get_uvicorn_config(self) -> dict:
        """Get optimized Uvicorn configuration"""
        return {
            "workers": self.optimal_workers,
            "loop": "uvloop",  # Faster event loop
            "http": "httptools",  # Faster HTTP parser
            "ws": "websockets",
            "lifespan": "on",
            "access_log": False,  # Disable for performance
            "log_level": "warning",
            "timeout_keep_alive": 65,
            "backlog": 2048,
            "limit_concurrency": self.optimal_workers * 100,
            "limit_max_requests": 10000,
        }
    
    def get_database_config(self) -> dict:
        """Get optimized database configuration"""
        return {
            "pool_size": self.db_pool_size,
            "max_overflow": self.db_max_overflow,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
            "echo": False,
            "pool_timeout": 30,
            "connect_args": {
                "connect_timeout": 10,
                "command_timeout": 60,
                "server_settings": {
                    "application_name": "aurora_robbiverse",
                    "jit": "on",  # Enable JIT compilation in PostgreSQL
                }
            }
        }
    
    def print_config(self):
        """Print current performance configuration"""
        print("🚀 PERFORMANCE CONFIGURATION - M3 OPTIMIZED")
        print("=" * 60)
        print(f"\n💻 HARDWARE:")
        print(f"   Physical Cores: {self.cpu_count}")
        print(f"   Logical Cores: {self.logical_cpu_count}")
        print(f"   Total Memory: {self.total_memory:.1f} GB")
        print(f"\n⚡ OPTIMIZATION:")
        print(f"   Uvicorn Workers: {self.optimal_workers}")
        print(f"   DB Pool Size: {self.db_pool_size}")
        print(f"   DB Max Overflow: {self.db_max_overflow}")
        print(f"   Async Threads: {self.async_worker_threads}")
        print(f"   Cache Size: {self.cache_size_mb} MB")
        print(f"\n🎯 EXPECTED PERFORMANCE:")
        print(f"   Max Concurrent Requests: {self.optimal_workers * 100}")
        print(f"   Estimated RPS: {self.optimal_workers * 1000}+")
        print(f"   WebSocket Connections: {self.optimal_workers * 500}+")


@lru_cache()
def get_performance_config() -> PerformanceConfig:
    """Get cached performance configuration"""
    return PerformanceConfig()


# In-memory cache for frequent queries
class SimpleCache:
    """Simple in-memory cache with TTL"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 300):
        self._cache = {}
        self._timestamps = {}
        self.max_size = max_size
        self.ttl = ttl
    
    def get(self, key: str) -> Optional[any]:
        """Get value from cache"""
        import time
        if key in self._cache:
            if time.time() - self._timestamps[key] < self.ttl:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._timestamps[key]
        return None
    
    def set(self, key: str, value: any):
        """Set value in cache"""
        import time
        if len(self._cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = min(self._timestamps, key=self._timestamps.get)
            del self._cache[oldest_key]
            del self._timestamps[oldest_key]
        
        self._cache[key] = value
        self._timestamps[key] = time.time()
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._timestamps.clear()


# Global cache instance
query_cache = SimpleCache(max_size=5000, ttl=300)  # 5 min TTL
