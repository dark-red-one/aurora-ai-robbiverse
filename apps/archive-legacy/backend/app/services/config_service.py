"""
Configuration Service - Environment Variable Management
Loads configuration from environment variables and updates database
"""
import os
import json
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import database

class ConfigService:
    """Service for managing application configuration"""

    def __init__(self):
        self.env_config = self._load_env_config()

    def _load_env_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables"""
        return {
            'deployment.primary_node': os.getenv('PRIMARY_NODE', 'aurora'),
            'deployment.gpu_config': os.getenv('GPU_CONFIG', '{"aurora": "2x RTX 4090", "collaboration": "1x RTX 4090", "fluenti": "1x RTX 4090"}'),
            'ai.default_model': os.getenv('DEFAULT_MODEL', 'llama3.1:8b'),
            'ai.temperature': os.getenv('AI_TEMPERATURE', '0.7'),
            'security.session_timeout': os.getenv('SESSION_TIMEOUT', '3600'),
            'features.gpu_mesh_enabled': os.getenv('GPU_MESH_ENABLED', 'true'),
        }

    async def initialize_config(self) -> None:
        """Initialize or update system configuration from environment"""
        try:
            for key, value in self.env_config.items():
                await self._upsert_config(key, value)
        except Exception as e:
            print(f"Error initializing config: {e}")

    async def _upsert_config(self, key: str, value: Any) -> None:
        """Upsert configuration value"""
        query = """
        INSERT INTO system_config (key, value, category, description, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        """

        # Determine category from key
        category = key.split('.')[0]
        description = f"Configuration for {key}"

        await database.execute(
            query,
            key,
            json.dumps(value) if not isinstance(value, str) else value,
            category,
            description
        )

    async def get_config(self, key: str) -> Optional[Any]:
        """Get configuration value"""
        query = "SELECT value FROM system_config WHERE key = $1"
        result = await database.fetch_one(query, key)

        if result:
            value = result['value']
            # Try to parse as JSON, fallback to string
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        # Fallback to environment variable
        return self.env_config.get(key)

    async def update_config(self, key: str, value: Any) -> None:
        """Update configuration value"""
        await self._upsert_config(key, value)

# Global instance
config_service = ConfigService()
