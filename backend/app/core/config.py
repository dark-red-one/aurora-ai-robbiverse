"""
Aurora RobbieVerse - Configuration Settings
"""
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict
import os

class Settings(BaseSettings):
    """Application settings"""
    
    model_config = ConfigDict(
        env_file="/workspace/aurora/config/.env",
        env_file_encoding="utf-8",
        extra="ignore",  # Allow extra fields from environment
        protected_namespaces=("settings_",)  # Fix pydantic warning
    )
    
    # Database
    database_url: str = Field(default="postgresql://aurora:password@localhost:5432/aurora")
    
    # API
    api_title: str = "Aurora RobbieVerse API"
    api_version: str = "1.0.0"
    debug: bool = Field(default=False)
    
    # Security
    secret_key: str = Field(default="your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # AI Models
    openai_api_key: str = Field(default="", description="OpenAI API key")
    models_cache_dir: str = Field(default="/workspace/aurora/models")  # Renamed to avoid conflict
    
    # WebSocket
    websocket_heartbeat_interval: int = 30

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
