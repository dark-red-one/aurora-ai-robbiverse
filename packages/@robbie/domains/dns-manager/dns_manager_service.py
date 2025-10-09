#!/usr/bin/env python3
"""
DNS Manager Service
Manages BIND9 DNS zones for Aurora domains
"""

import asyncio
import json
import logging
import os
import subprocess
import time
from datetime import datetime
from typing import Dict, List, Optional

import httpx
import redis
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="DNS Manager", version="1.0.0")

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class DNSRecord(BaseModel):
    name: str
    type: str  # A, AAAA, CNAME, MX, TXT, etc.
    value: str
    ttl: int = 300

class ZoneUpdate(BaseModel):
    zone: str
    records: List[DNSRecord]
    action: str  # "add", "update", "delete"

class DNSManager:
    def __init__(self):
        self.zones_dir = "/etc/bind/zones"
        self.named_conf = "/etc/bind/named.conf"
        self.zones = [
            "aurora.local",
            "robbie.local", 
            "testpilot.local",
            "robbieblocks.local",
            "leadershipquotes.local",
            "heyshopper.local"
        ]
        
    async def start_bind(self):
        """Start BIND9 service"""
        try:
            # Start BIND9
            subprocess.run(["named", "-c", "/etc/bind/named.conf"], check=True)
            logger.info("✅ BIND9 started successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to start BIND9: {e}")
            return False
    
    async def reload_zones(self):
        """Reload DNS zones"""
        try:
            # Reload zones using rndc
            result = subprocess.run(["rndc", "reload"], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info("✅ DNS zones reloaded successfully")
                return True
            else:
                logger.error(f"❌ Failed to reload zones: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ Error reloading zones: {e}")
            return False
    
    async def add_record(self, zone: str, record: DNSRecord):
        """Add a DNS record to a zone"""
        try:
            zone_file = f"{self.zones_dir}/{zone}.zone"
            
            # Read current zone file
            with open(zone_file, 'r') as f:
                content = f.read()
            
            # Add new record
            new_record = f"{record.name:<20} IN  {record.type:<6} {record.value}\n"
            content += new_record
            
            # Write back to zone file
            with open(zone_file, 'w') as f:
                f.write(content)
            
            # Update serial number
            await self._update_serial(zone_file)
            
            # Reload zones
            await self.reload_zones()
            
            logger.info(f"✅ Added {record.type} record {record.name} to {zone}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add record: {e}")
            return False
    
    async def update_record(self, zone: str, record: DNSRecord):
        """Update a DNS record in a zone"""
        try:
            zone_file = f"{self.zones_dir}/{zone}.zone"
            
            # Read current zone file
            with open(zone_file, 'r') as f:
                lines = f.readlines()
            
            # Find and update record
            updated = False
            for i, line in enumerate(lines):
                if (record.name in line and 
                    f"IN  {record.type}" in line and 
                    not line.strip().startswith(';')):
                    lines[i] = f"{record.name:<20} IN  {record.type:<6} {record.value}\n"
                    updated = True
                    break
            
            if not updated:
                # Record not found, add it
                lines.append(f"{record.name:<20} IN  {record.type:<6} {record.value}\n")
            
            # Write back to zone file
            with open(zone_file, 'w') as f:
                f.writelines(lines)
            
            # Update serial number
            await self._update_serial(zone_file)
            
            # Reload zones
            await self.reload_zones()
            
            logger.info(f"✅ Updated {record.type} record {record.name} in {zone}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update record: {e}")
            return False
    
    async def delete_record(self, zone: str, record: DNSRecord):
        """Delete a DNS record from a zone"""
        try:
            zone_file = f"{self.zones_dir}/{zone}.zone"
            
            # Read current zone file
            with open(zone_file, 'r') as f:
                lines = f.readlines()
            
            # Remove record
            new_lines = []
            for line in lines:
                if not (record.name in line and 
                       f"IN  {record.type}" in line and 
                       not line.strip().startswith(';')):
                    new_lines.append(line)
            
            # Write back to zone file
            with open(zone_file, 'w') as f:
                f.writelines(new_lines)
            
            # Update serial number
            await self._update_serial(zone_file)
            
            # Reload zones
            await self.reload_zones()
            
            logger.info(f"✅ Deleted {record.type} record {record.name} from {zone}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete record: {e}")
            return False
    
    async def _update_serial(self, zone_file: str):
        """Update serial number in zone file"""
        try:
            with open(zone_file, 'r') as f:
                content = f.read()
            
            # Find and update serial number
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'SOA' in line and 'Serial' in line:
                    # Extract current serial
                    parts = line.split()
                    for j, part in enumerate(parts):
                        if part.isdigit() and len(part) >= 8:  # YYYYMMDD format
                            # Increment serial
                            new_serial = str(int(part) + 1)
                            parts[j] = new_serial
                            lines[i] = ' '.join(parts)
                            break
                    break
            
            # Write back
            with open(zone_file, 'w') as f:
                f.write('\n'.join(lines))
                
        except Exception as e:
            logger.error(f"Error updating serial: {e}")
    
    async def get_zone_records(self, zone: str) -> List[Dict]:
        """Get all records from a zone"""
        try:
            zone_file = f"{self.zones_dir}/{zone}.zone"
            
            with open(zone_file, 'r') as f:
                content = f.read()
            
            records = []
            lines = content.split('\n')
            
            for line in lines:
                line = line.strip()
                if (line and not line.startswith(';') and 
                    not line.startswith('$') and 
                    'IN' in line and 
                    'SOA' not in line):
                    
                    parts = line.split()
                    if len(parts) >= 4:
                        records.append({
                            "name": parts[0],
                            "type": parts[2],
                            "value": ' '.join(parts[3:]),
                            "ttl": parts[1] if parts[1].isdigit() else 300
                        })
            
            return records
            
        except Exception as e:
            logger.error(f"Error reading zone records: {e}")
            return []
    
    async def health_check(self) -> bool:
        """Check if BIND9 is running"""
        try:
            result = subprocess.run(["rndc", "status"], capture_output=True, text=True)
            return result.returncode == 0
        except Exception:
            return False

# Initialize DNS manager
dns_manager = DNSManager()

@app.on_event("startup")
async def startup():
    """Start BIND9 on startup"""
    await dns_manager.start_bind()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    bind_healthy = await dns_manager.health_check()
    return {
        "status": "healthy" if bind_healthy else "unhealthy",
        "service": "dns-manager",
        "bind_running": bind_healthy
    }

@app.get("/api/zones")
async def list_zones():
    """List all managed zones"""
    return {"zones": dns_manager.zones}

@app.get("/api/zones/{zone}/records")
async def get_zone_records(zone: str):
    """Get all records from a zone"""
    if zone not in dns_manager.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    records = await dns_manager.get_zone_records(zone)
    return {"zone": zone, "records": records}

@app.post("/api/zones/{zone}/records")
async def add_zone_record(zone: str, record: DNSRecord):
    """Add a record to a zone"""
    if zone not in dns_manager.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    success = await dns_manager.add_record(zone, record)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add record")
    
    return {"message": "Record added successfully"}

@app.put("/api/zones/{zone}/records")
async def update_zone_record(zone: str, record: DNSRecord):
    """Update a record in a zone"""
    if zone not in dns_manager.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    success = await dns_manager.update_record(zone, record)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update record")
    
    return {"message": "Record updated successfully"}

@app.delete("/api/zones/{zone}/records")
async def delete_zone_record(zone: str, record: DNSRecord):
    """Delete a record from a zone"""
    if zone not in dns_manager.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    success = await dns_manager.delete_record(zone, record)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete record")
    
    return {"message": "Record deleted successfully"}

@app.post("/api/zones/reload")
async def reload_all_zones():
    """Reload all DNS zones"""
    success = await dns_manager.reload_zones()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reload zones")
    
    return {"message": "Zones reloaded successfully"}

@app.get("/api/status")
async def get_dns_status():
    """Get DNS service status"""
    bind_healthy = await dns_manager.health_check()
    return {
        "bind_running": bind_healthy,
        "zones_managed": len(dns_manager.zones),
        "zones": dns_manager.zones
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8015)
