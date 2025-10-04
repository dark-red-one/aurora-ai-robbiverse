#!/usr/bin/env python3
"""
Aurora AI Empire - Comprehensive GPU Mesh Testing
Tests all 4 GPUs across the distributed network
"""

import subprocess
import json
import torch
import time
import socket
from datetime import datetime
import requests
import os

class GPUMeshTester:
    def __init__(self):
        self.nodes = {
            'aurora': {'ip': '82.221.170.242', 'gpus': 2, 'model': 'RTX 4090'},
            'collaboration': {'ip': 'TBD', 'gpus': 1, 'model': 'RTX 4090'},
            'fluenti': {'ip': 'TBD', 'gpus': 1, 'model': 'RTX 4090'}
        }
        self.total_gpus = 4
        
    def test_local_gpus(self):
        """Test locally available GPUs"""
        print("=" * 60)
        print("🔍 TESTING LOCAL GPU CONFIGURATION")
        print("=" * 60)
        
        # Check CUDA availability
        print("\n📊 CUDA Status:")
        print(f"   CUDA Available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   PyTorch CUDA: {torch.cuda.get_device_name(0)}")
        
        # Get nvidia-smi output
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=index,name,memory.total,memory.free,utilization.gpu,temperature.gpu,power.draw', 
                 '--format=csv,noheader,nounits'],
                capture_output=True, text=True, check=True
            )
            
            gpus = result.stdout.strip().split('\n')
            print(f"\n🎮 Local GPUs Found: {len(gpus)}")
            print("-" * 60)
            
            for i, gpu_info in enumerate(gpus):
                parts = [p.strip() for p in gpu_info.split(',')]
                print(f"\n   GPU {i}:")
                print(f"   • Name: {parts[1]}")
                print(f"   • Memory: {parts[3]}/{parts[2]} MB free")
                print(f"   • Utilization: {parts[4]}%")
                print(f"   • Temperature: {parts[5]}°C")
                print(f"   • Power Draw: {parts[6]}W")
                
            return len(gpus)
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Error running nvidia-smi: {e}")
            return 0
    
    def test_pytorch_gpus(self):
        """Test GPU access via PyTorch"""
        print("\n" + "=" * 60)
        print("🔥 TESTING PYTORCH GPU ACCESS")
        print("=" * 60)
        
        if not torch.cuda.is_available():
            print("❌ CUDA not available in PyTorch")
            return 0
        
        device_count = torch.cuda.device_count()
        print(f"\n📊 PyTorch GPU Count: {device_count}")
        
        for i in range(device_count):
            print(f"\n   GPU {i}: {torch.cuda.get_device_name(i)}")
            props = torch.cuda.get_device_properties(i)
            print(f"   • Compute Capability: {props.major}.{props.minor}")
            print(f"   • Total Memory: {props.total_memory / 1024**3:.2f} GB")
            print(f"   • Multiprocessors: {props.multi_processor_count}")
            
            # Test GPU computation
            try:
                device = torch.device(f'cuda:{i}')
                test_tensor = torch.randn(1000, 1000).to(device)
                result = torch.matmul(test_tensor, test_tensor)
                print(f"   ✅ Computation test passed")
            except Exception as e:
                print(f"   ❌ Computation test failed: {e}")
        
        return device_count
    
    def test_gpu_mesh_network(self):
        """Test GPU mesh network connectivity"""
        print("\n" + "=" * 60)
        print("🌐 TESTING GPU MESH NETWORK")
        print("=" * 60)
        
        print(f"\n📡 Expected Total GPUs: {self.total_gpus}")
        print(f"   • Aurora Node: 2x RTX 4090")
        print(f"   • Collaboration Node: 1x RTX 4090")
        print(f"   • Fluenti Node: 1x RTX 4090")
        
        # Check if GPU mesh service is running
        try:
            result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            if 'gpu-mesh' in result.stdout.lower() or 'gpu_mesh' in result.stdout.lower():
                print("\n✅ GPU Mesh service detected")
            else:
                print("\n⚠️  GPU Mesh service not running")
                print("   To start: python3 /workspace/aurora/gpu_mesh/gpu_mesh_node.py")
        except Exception as e:
            print(f"\n❌ Error checking GPU mesh service: {e}")
        
        # Check network connectivity to other nodes
        print("\n🔗 Network Connectivity:")
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        print(f"   Current Node: {hostname} ({local_ip})")
        
        # Check for mesh configuration
        mesh_config = "/workspace/aurora/gpu_mesh/config.json"
        if os.path.exists(mesh_config):
            with open(mesh_config, 'r') as f:
                config = json.load(f)
                print(f"\n📋 Mesh Configuration Found:")
                print(f"   Nodes configured: {len(config.get('nodes', []))}")
        else:
            print("\n⚠️  No mesh configuration found at", mesh_config)
    
    def run_distributed_test(self):
        """Run a distributed GPU test"""
        print("\n" + "=" * 60)
        print("🚀 DISTRIBUTED GPU TEST")
        print("=" * 60)
        
        # Simulate distributed workload
        print("\n📊 Simulating distributed workload:")
        
        local_gpus = torch.cuda.device_count() if torch.cuda.is_available() else 0
        print(f"   • Local GPUs available: {local_gpus}")
        print(f"   • Remote GPUs (configured): {self.total_gpus - local_gpus}")
        
        if local_gpus > 0:
            print("\n🔄 Running parallel computation on local GPUs...")
            for i in range(local_gpus):
                device = torch.device(f'cuda:{i}')
                # Create large tensor for memory test
                size = 2048
                A = torch.randn(size, size, device=device)
                B = torch.randn(size, size, device=device)
                
                start = time.time()
                C = torch.matmul(A, B)
                torch.cuda.synchronize(device)
                elapsed = time.time() - start
                
                print(f"   GPU {i}: Matrix multiply ({size}x{size}) in {elapsed:.3f}s")
                
                # Check memory after operation
                mem_allocated = torch.cuda.memory_allocated(device) / 1024**3
                mem_reserved = torch.cuda.memory_reserved(device) / 1024**3
                print(f"   GPU {i}: Memory - Allocated: {mem_allocated:.2f}GB, Reserved: {mem_reserved:.2f}GB")
        
        print("\n" + "=" * 60)
        print("📈 PERFORMANCE METRICS")
        print("=" * 60)
        
        if local_gpus > 0:
            # Calculate theoretical performance
            rtx4090_tflops = 82.6  # FP32 TFLOPS for RTX 4090
            total_tflops = rtx4090_tflops * self.total_gpus
            active_tflops = rtx4090_tflops * local_gpus
            
            print(f"\n🔥 Theoretical Performance:")
            print(f"   • Single RTX 4090: {rtx4090_tflops:.1f} TFLOPS")
            print(f"   • Local GPUs ({local_gpus}x): {active_tflops:.1f} TFLOPS")
            print(f"   • Full Mesh ({self.total_gpus}x): {total_tflops:.1f} TFLOPS")
            print(f"   • Current Utilization: {(local_gpus/self.total_gpus)*100:.1f}%")

def main():
    print("\n" + "🎮" * 30)
    print("     AURORA AI EMPIRE - GPU MESH VALIDATOR")
    print("     Testing 4x RTX 4090 Configuration")
    print("🎮" * 30 + "\n")
    
    tester = GPUMeshTester()
    
    # Run all tests
    local_count = tester.test_local_gpus()
    pytorch_count = tester.test_pytorch_gpus()
    tester.test_gpu_mesh_network()
    tester.run_distributed_test()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FINAL GPU MESH STATUS")
    print("=" * 60)
    
    print(f"\n✅ Local GPUs Detected: {local_count}")
    print(f"✅ PyTorch GPUs Available: {pytorch_count}")
    print(f"⚠️  Remote GPUs Configured: {tester.total_gpus - local_count}")
    print(f"📍 Total Expected GPUs: {tester.total_gpus}")
    
    if local_count < tester.total_gpus:
        print("\n⚠️  NOTE: Only local GPUs are currently visible.")
        print("   Other GPUs are on remote RunPod nodes:")
        print("   • Collaboration node (1x RTX 4090)")
        print("   • Fluenti node (1x RTX 4090)")
        print("\n   To access all 4 GPUs, you need to:")
        print("   1. Start GPU mesh service on all nodes")
        print("   2. Configure network connectivity between nodes")
        print("   3. Use distributed computing framework (Ray/Horovod)")
    else:
        print("\n🎉 All GPUs detected and operational!")
    
    print("\n" + "🚀" * 30 + "\n")

if __name__ == "__main__":
    main()
