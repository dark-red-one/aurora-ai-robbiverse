#!/usr/bin/env python3
"""
Redis Sentinel Monitoring Script
Checks Sentinel health, master status, and failover events
"""

import redis
import redis.sentinel
import time
import json
from datetime import datetime
import sys

def monitor_sentinel():
    """Monitor Redis Sentinel status"""
    
    # Sentinel hosts
    sentinel_hosts = [
        ("172.20.0.11", 26379),  # Aurora
        ("10.0.0.2", 26379),     # Star  
        ("10.0.0.10", 26379)     # Vengeance
    ]
    
    master_name = "aurora-redis"
    password = "robbie-2025"  # Should come from env
    
    try:
        # Connect to Sentinel
        sentinel = redis.sentinel.Sentinel(
            sentinel_hosts,
            password=password,
            socket_timeout=5.0
        )
        
        print(f"🔍 Monitoring Redis Sentinel - {datetime.now()}")
        print("=" * 60)
        
        # Check Sentinel status
        print("\n📊 Sentinel Status:")
        for i, (host, port) in enumerate(sentinel_hosts, 1):
            try:
                sentinel_client = redis.Redis(host=host, port=port, password=password)
                info = sentinel_client.info()
                print(f"  Sentinel {i} ({host}:{port}): ✅ UP")
                print(f"    - Uptime: {info.get('uptime_in_seconds', 0)}s")
                print(f"    - Memory: {info.get('used_memory_human', 'N/A')}")
            except Exception as e:
                print(f"  Sentinel {i} ({host}:{port}): ❌ DOWN - {e}")
        
        # Check master status
        print("\n👑 Master Status:")
        try:
            masters = sentinel.masters()
            master_info = masters.get(master_name, {})
            
            if master_info:
                print(f"  Master: {master_info.get('ip', 'unknown')}:{master_info.get('port', 'unknown')}")
                print(f"  Status: {master_info.get('flags', 'unknown')}")
                print(f"  Last PING: {master_info.get('last-ping-reply', 'unknown')}ms")
            else:
                print("  ❌ No master found!")
                
        except Exception as e:
            print(f"  ❌ Failed to get master info: {e}")
        
        # Check slaves
        print("\n🔄 Slaves Status:")
        try:
            slaves = sentinel.slaves(master_name)
            if slaves:
                for i, slave in enumerate(slaves, 1):
                    print(f"  Slave {i}: {slave.get('ip', 'unknown')}:{slave.get('port', 'unknown')}")
                    print(f"    Status: {slave.get('flags', 'unknown')}")
                    print(f"    Lag: {slave.get('master-link-down-time', 'unknown')}")
            else:
                print("  ⚠️ No slaves found")
        except Exception as e:
            print(f"  ❌ Failed to get slaves info: {e}")
        
        # Test Redis connection
        print("\n🔗 Redis Connection Test:")
        try:
            master = sentinel.master_for(master_name, password=password)
            slave = sentinel.slave_for(master_name, password=password)
            
            # Test write to master
            master.set("sentinel_test", f"test_{int(time.time())}")
            print("  Master write: ✅")
            
            # Test read from slave
            value = slave.get("sentinel_test")
            print(f"  Slave read: ✅ (value: {value})")
            
        except Exception as e:
            print(f"  ❌ Redis connection test failed: {e}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Sentinel monitoring failed: {e}")
        sys.exit(1)

def check_failover_events():
    """Check for recent failover events"""
    print("\n🚨 Failover Events Check:")
    
    # This would typically check logs or Sentinel events
    # For now, just show current master
    try:
        sentinel = redis.sentinel.Sentinel([
            ("172.20.0.11", 26379),
            ("10.0.0.2", 26379),
            ("10.0.0.10", 26379)
        ], password="robbie-2025")
        
        masters = sentinel.masters()
        master_info = masters.get("aurora-redis", {})
        
        if master_info:
            print(f"  Current master: {master_info.get('ip')}:{master_info.get('port')}")
            print(f"  Master since: {master_info.get('master-host', 'unknown')}")
        else:
            print("  ❌ No master information available")
            
    except Exception as e:
        print(f"  ❌ Failed to check failover events: {e}")

if __name__ == "__main__":
    monitor_sentinel()
    check_failover_events()
    
    print(f"\n✅ Monitoring complete - {datetime.now()}")
    print("Run this script every 30 seconds for continuous monitoring")
