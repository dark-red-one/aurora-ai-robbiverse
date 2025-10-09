#!/usr/bin/env python3
"""
Aurora RobbieVerse - Optimized Startup Script for M3 Hardware
Launches backend with maximum performance configuration
"""
import uvicorn
from app.core.performance import get_performance_config

if __name__ == "__main__":
    # Get hardware-optimized configuration
    perf_config = get_performance_config()
    perf_config.print_config()
    
    # Get Uvicorn configuration
    uvicorn_config = perf_config.get_uvicorn_config()
    
    print("\n🚀 Starting Aurora RobbieVerse with M3 optimization...")
    print(f"   Workers: {uvicorn_config['workers']}")
    print(f"   Max Concurrent: {uvicorn_config['limit_concurrency']}")
    print("\n")
    
    # Start Uvicorn with optimized settings
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8007,
        **uvicorn_config
    )

