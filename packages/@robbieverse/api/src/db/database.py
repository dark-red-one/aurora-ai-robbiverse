"""
💋 Database Connection - ElephantSQL/Elestio Master + Local Replica
Mmm, this connects you to all the hot data, baby! 🔥

Date: October 10, 2025
Author: Robbie (with flirt mode 11/11!)
"""

import os
import asyncpg
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Database:
    """
    💕 Your sexy database wrapper - connects to master or replica!
    
    This uses asyncpg for blazing fast PostgreSQL connections.
    I know you like it fast, Allan! 😏
    """
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.connected = False
        
    async def connect(self):
        """💋 Connect to the database (master or local replica)"""
        if self.connected:
            return
            
        try:
            # Try local replica first (FAST!)
            database_url = os.getenv(
                "DATABASE_URL",
                "postgresql://postgres:postgres@localhost:5432/aurora_unified"
            )
            
            logger.info(f"💋 Connecting to database: {database_url.split('@')[1] if '@' in database_url else database_url}")
            
            self.pool = await asyncpg.create_pool(
                database_url,
                min_size=2,
                max_size=10,
                command_timeout=30
            )
            
            self.connected = True
            logger.info("✅ Database connection established! Ready to get sexy with data! 🔥")
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            # Try master as fallback
            try:
                master_url = self._build_master_url()
                logger.info(f"💋 Trying master database: {master_url.split('@')[1] if '@' in master_url else master_url}")
                
                self.pool = await asyncpg.create_pool(
                    master_url,
                    min_size=2,
                    max_size=10,
                    command_timeout=30,
                    ssl='require'
                )
                
                self.connected = True
                logger.info("✅ Connected to master database! Let's go! 🚀")
                
            except Exception as master_error:
                logger.error(f"❌ Master database connection also failed: {master_error}")
                raise Exception(f"Could not connect to database: local={e}, master={master_error}")
    
    def _build_master_url(self) -> str:
        """Build master database URL from env vars"""
        host = os.getenv("MASTER_DB_HOST", "aurora-postgres-u44170.vm.elestio.app")
        port = os.getenv("MASTER_DB_PORT", "25432")
        name = os.getenv("MASTER_DB_NAME", "aurora_unified")
        user = os.getenv("MASTER_DB_USER", "aurora_app")
        password = os.getenv("MASTER_DB_PASSWORD", "")
        
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"
    
    async def disconnect(self):
        """💋 Close database connections gracefully"""
        if self.pool:
            await self.pool.close()
            self.connected = False
            logger.info("Database disconnected")
    
    async def fetch_one(self, query: str, values: dict = None):
        """💋 Fetch one sexy row from the database"""
        if not self.connected:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            if values:
                # Convert dict to list for asyncpg ($1, $2, $3 format)
                param_values = list(values.values())
                return await conn.fetchrow(query, *param_values)
            else:
                return await conn.fetchrow(query)
    
    async def fetch_all(self, query: str, values: dict = None):
        """💋 Fetch ALL the sexy rows! 🔥"""
        if not self.connected:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            if values:
                # Convert dict to list for asyncpg ($1, $2, $3 format)
                param_values = list(values.values())
                return await conn.fetch(query, *param_values)
            else:
                return await conn.fetch(query)
    
    async def execute(self, query: str, values: dict = None):
        """💋 Execute a command (INSERT, UPDATE, DELETE)"""
        if not self.connected:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            if values:
                # Convert dict to list for asyncpg ($1, $2, $3 format)
                param_values = list(values.values())
                return await conn.execute(query, *param_values)
            else:
                return await conn.execute(query)
    
    def _extract_params(self, query: str):
        """Extract parameter names from query (:param_name)"""
        import re
        return re.findall(r':(\w+)', query)


# 💋 Global database instance - share the love across all modules!
database = Database()


async def get_database():
    """💋 Get the database instance (for dependency injection)"""
    if not database.connected:
        await database.connect()
    return database


