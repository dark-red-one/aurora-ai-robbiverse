#!/usr/bin/env python3

"""
🌐 AURORA AI EMPIRE SIMPLE MONITOR
==================================
Lightweight monitoring without Docker dependencies
"""

import subprocess
import time
import json
import os
import sys
from datetime import datetime
import psutil

class AuroraMonitor:
    def __init__(self):
        self.nodes = {
            'Aurora (Current)': {'host': 'localhost', 'port': 8000, 'user': 'allan'},
            'Vengeance': {'host': 'vengeance', 'port': 22, 'user': 'allan'},
            'RobbieBook1': {'host': '192.199.240.226', 'port': 22, 'user': 'allanperetz'},
            'RunPod Aurora': {'host': '82.221.170.242', 'port': 24505, 'user': 'root'},
            'RunPod Collaboration': {'host': '213.181.111.2', 'port': 43540, 'user': 'root'},
            'RunPod Fluenti': {'host': '103.196.86.56', 'port': 19777, 'user': 'root'},
        }

    def ping_test(self, host):
        """Test if host is reachable"""
        try:
            result = subprocess.run(['ping', '-c', '1', '-W', '2', host], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False

    def ssh_test(self, host, port, user):
        """Test SSH connection"""
        try:
            cmd = ['ssh', '-o', 'ConnectTimeout=3', '-o', 'StrictHostKeyChecking=no', 
                   '-p', str(port), f'{user}@{host}', 'echo "SSH OK"']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False

    def get_local_system_info(self):
        """Get local system information"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'CPU': f"{cpu_percent:.1f}%",
                'MEM': f"{memory.percent:.1f}%",
                'DISK': f"{(disk.used / disk.total * 100):.1f}%"
            }
        except:
            return {}

    def check_network_status(self):
        """Check all network nodes"""
        print("🌐 AURORA AI EMPIRE NETWORK STATUS")
        print("=" * 40)
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # Local system info
        print("🏠 LOCAL SYSTEM (Aurora):")
        print("-" * 30)
        local_info = self.get_local_system_info()
        for key, value in local_info.items():
            print(f"   {key}: {value}")
        print()

        # Check nodes
        print("🌐 NETWORK NODES:")
        print("-" * 30)
        
        for name, config in self.nodes.items():
            host = config['host']
            port = config['port']
            user = config['user']
            
            print(f"🔍 {name} ({host}:{port}): ", end="")
            
            # Test ping
            if self.ping_test(host):
                print("✅ Ping ", end="")
                
                # Test SSH
                if self.ssh_test(host, port, user):
                    print("✅ SSH OK")
                else:
                    print("⚠️  SSH Failed")
            else:
                print("❌ Not Reachable")
        print()

if __name__ == "__main__":
    monitor = AuroraMonitor()
    monitor.check_network_status()