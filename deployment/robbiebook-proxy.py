#!/usr/bin/env python3
"""
RobbieBook1.testpilot.ai - Aurora AI Empire
Transparent HTTP/HTTPS Proxy with Aggressive Caching
"""
import asyncio
import aiohttp
import aiofiles
import hashlib
import json
import time
import os
import re
from datetime import datetime, timedelta
from urllib.parse import urlparse, urljoin
from pathlib import Path
import mimetypes
import gzip
import base64

class RobbieBookProxy:
    """Transparent proxy for RobbieBook1 with aggressive caching"""
    
    def __init__(self, host='127.0.0.1', port=8080, cache_dir='./robbiebook_cache'):
        self.host = host
        self.port = port
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Cache statistics
        self.stats = {
            'requests': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'bytes_saved': 0,
            'start_time': time.time()
        }
        
        # Cache configuration
        self.cache_config = {
            'max_age': 86400 * 7,  # 7 days
            'max_size': 1024 * 1024 * 1024,  # 1GB
            'compress': True,
            'aggressive_cache': True
        }
        
        print(f"🚀 RobbieBook1.testpilot.ai Proxy Starting...")
        print(f"   Host: {self.host}:{self.port}")
        print(f"   Cache: {self.cache_dir}")
        print(f"   Max Age: {self.cache_config['max_age']} seconds")
        print(f"   Max Size: {self.cache_config['max_size'] / (1024*1024):.1f} MB")
    
    def get_cache_path(self, url):
        """Generate cache file path for URL"""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return self.cache_dir / f"{url_hash}.cache"
    
    def get_meta_path(self, url):
        """Generate metadata file path for URL"""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return self.cache_dir / f"{url_hash}.meta"
    
    async def is_cached(self, url):
        """Check if URL is cached and still valid"""
        cache_path = self.get_cache_path(url)
        meta_path = self.get_meta_path(url)
        
        if not cache_path.exists() or not meta_path.exists():
            return False
        
        try:
            async with aiofiles.open(meta_path, 'r') as f:
                metadata = json.loads(await f.read())
            
            # Check if cache is expired
            if time.time() - metadata['timestamp'] > self.cache_config['max_age']:
                return False
            
            # Check if cache file exists and has content
            if not cache_path.exists() or cache_path.stat().st_size == 0:
                return False
            
            return True
        except:
            return False
    
    async def get_cached_content(self, url):
        """Retrieve cached content"""
        cache_path = self.get_cache_path(url)
        meta_path = self.get_meta_path(url)
        
        try:
            async with aiofiles.open(meta_path, 'r') as f:
                metadata = json.loads(await f.read())
            
            async with aiofiles.open(cache_path, 'rb') as f:
                content = await f.read()
            
            # Decompress if needed
            if metadata.get('compressed', False):
                content = gzip.decompress(content)
            
            return content, metadata
        except Exception as e:
            print(f"❌ Cache read error: {e}")
            return None, None
    
    async def cache_content(self, url, content, headers, status_code):
        """Cache content with metadata"""
        cache_path = self.get_cache_path(url)
        meta_path = self.get_meta_path(url)
        
        try:
            # Prepare metadata
            metadata = {
                'url': url,
                'timestamp': time.time(),
                'status_code': status_code,
                'headers': dict(headers),
                'size': len(content),
                'compressed': False
            }
            
            # Compress content if enabled
            if self.cache_config['compress'] and len(content) > 1024:
                content = gzip.compress(content)
                metadata['compressed'] = True
            
            # Write cache file
            async with aiofiles.open(cache_path, 'wb') as f:
                await f.write(content)
            
            # Write metadata
            async with aiofiles.open(meta_path, 'w') as f:
                await f.write(json.dumps(metadata, indent=2))
            
            print(f"💾 Cached: {url[:60]}... ({len(content)} bytes)")
            
        except Exception as e:
            print(f"❌ Cache write error: {e}")
    
    async def should_cache(self, url, headers, status_code):
        """Determine if content should be cached"""
        # Don't cache non-200 responses
        if status_code != 200:
            return False
        
        # Don't cache very large files
        content_length = headers.get('content-length')
        if content_length and int(content_length) > self.cache_config['max_size']:
            return False
        
        # Don't cache certain content types
        content_type = headers.get('content-type', '').lower()
        no_cache_types = [
            'application/octet-stream',
            'video/',
            'audio/',
            'application/pdf'  # Can be large
        ]
        
        for no_cache in no_cache_types:
            if no_cache in content_type:
                return False
        
        # Cache everything else aggressively
        return True
    
    async def fetch_url(self, url, method='GET', headers=None, data=None):
        """Fetch URL with caching"""
        self.stats['requests'] += 1
        
        # Check cache first
        if await self.is_cached(url):
            print(f"🎯 Cache HIT: {url[:60]}...")
            self.stats['cache_hits'] += 1
            content, metadata = await self.get_cached_content(url)
            if content:
                return content, metadata['headers'], metadata['status_code']
        
        print(f"🌐 Fetching: {url[:60]}...")
        self.stats['cache_misses'] += 1
        
        # Fetch from internet
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method, url, 
                    headers=headers, 
                    data=data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    content = await response.read()
                    response_headers = dict(response.headers)
                    
                    # Cache if appropriate
                    if await self.should_cache(url, response_headers, response.status):
                        await self.cache_content(url, content, response_headers, response.status)
                    
                    return content, response_headers, response.status
                    
        except Exception as e:
            print(f"❌ Fetch error: {e}")
            return None, {}, 500
    
    async def handle_request(self, reader, writer):
        """Handle incoming HTTP request"""
        try:
            # Read request
            request_line = await reader.readline()
            if not request_line:
                return
            
            request_str = request_line.decode().strip()
            method, url, version = request_line.decode().strip().split()
            
            # Read headers
            headers = {}
            while True:
                line = await reader.readline()
                if line == b'\r\n':
                    break
                if line:
                    key, value = line.decode().strip().split(': ', 1)
                    headers[key.lower()] = value
            
            # Parse URL
            if url.startswith('http://') or url.startswith('https://'):
                full_url = url
            else:
                # Assume HTTP if no scheme
                full_url = f"http://{url}"
            
            print(f"📥 {method} {full_url}")
            
            # Fetch content
            content, response_headers, status_code = await self.fetch_url(
                full_url, method, headers
            )
            
            if content is None:
                # Send error response
                error_response = b"HTTP/1.1 500 Internal Server Error\r\n\r\nProxy Error"
                writer.write(error_response)
                await writer.drain()
                return
            
            # Prepare response
            response_line = f"HTTP/1.1 {status_code} OK\r\n"
            
            # Add headers
            response_headers_str = ""
            for key, value in response_headers.items():
                if key.lower() not in ['transfer-encoding', 'connection']:
                    response_headers_str += f"{key}: {value}\r\n"
            
            # Add proxy headers
            response_headers_str += "X-RobbieBook-Proxy: 1.0\r\n"
            response_headers_str += f"X-Cache-Status: {'HIT' if self.stats['cache_hits'] > 0 else 'MISS'}\r\n"
            response_headers_str += "Connection: close\r\n"
            
            # Send response
            response = response_line.encode() + response_headers_str.encode() + b"\r\n" + content
            writer.write(response)
            await writer.drain()
            
        except Exception as e:
            print(f"❌ Request error: {e}")
        finally:
            writer.close()
            await writer.wait_closed()
    
    async def start_server(self):
        """Start the proxy server"""
        print(f"🚀 Starting RobbieBook1 Proxy Server...")
        print(f"   Listening on {self.host}:{self.port}")
        print(f"   Cache directory: {self.cache_dir}")
        print(f"   Press Ctrl+C to stop")
        print()
        
        server = await asyncio.start_server(
            self.handle_request, 
            self.host, 
            self.port
        )
        
        print(f"✅ RobbieBook1 Proxy is running!")
        print(f"   Configure your browser to use: {self.host}:{self.port}")
        print(f"   Or use: export http_proxy=http://{self.host}:{self.port}")
        print()
        
        try:
            await server.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Stopping RobbieBook1 Proxy...")
            server.close()
            await server.wait_closed()
            self.print_stats()
    
    def print_stats(self):
        """Print cache statistics"""
        uptime = time.time() - self.stats['start_time']
        hit_rate = (self.stats['cache_hits'] / self.stats['requests'] * 100) if self.stats['requests'] > 0 else 0
        
        print(f"\n📊 RobbieBook1 Proxy Statistics")
        print(f"   Uptime: {uptime:.1f} seconds")
        print(f"   Total Requests: {self.stats['requests']}")
        print(f"   Cache Hits: {self.stats['cache_hits']} ({hit_rate:.1f}%)")
        print(f"   Cache Misses: {self.stats['cache_misses']}")
        print(f"   Cache Directory: {self.cache_dir}")
        
        # Calculate cache size
        cache_size = sum(f.stat().st_size for f in self.cache_dir.glob('*.cache'))
        print(f"   Cache Size: {cache_size / (1024*1024):.1f} MB")

async def main():
    """Main function"""
    print("🤖 RobbieBook1.testpilot.ai - Aurora AI Empire")
    print("   Transparent HTTP/HTTPS Proxy with Aggressive Caching")
    print("=" * 60)
    
    proxy = RobbieBookProxy(
        host='127.0.0.1',
        port=8080,
        cache_dir='./robbiebook_cache'
    )
    
    await proxy.start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 RobbieBook1 Proxy stopped!")









