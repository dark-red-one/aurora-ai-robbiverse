"""
Aurora AI Empire - Centralized Configuration System
Replaces scattered configuration across multiple files
Version: 2.0.0
"""

import os
import json
import secrets
from pathlib import Path
from typing import Dict, Any, Optional, List
from enum import Enum
from pydantic import Field, validator, SecretStr
from pydantic_settings import BaseSettings
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# ============================================
# ENVIRONMENT DETECTION
# ============================================

class Environment(str, Enum):
    """Deployment environments"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"

class NodeRole(str, Enum):
    """Node roles in the cluster"""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    MARKETING = "marketing"
    TRAINING = "training"
    DEVELOPMENT = "development"

# ============================================
# CONFIGURATION CLASSES
# ============================================

class DatabaseConfig(BaseSettings):
    """Database configuration"""
    host: str = Field(default="localhost", env="DB_HOST")
    port: int = Field(default=5432, env="DB_PORT")
    name: str = Field(default="aurora", env="DB_NAME")
    user: str = Field(default="aurora_app", env="DB_USER")
    password: SecretStr = Field(default="aurora_secure_2025", env="DB_PASSWORD")
    pool_size: int = Field(default=20, env="DB_POOL_SIZE")
    max_overflow: int = Field(default=40, env="DB_MAX_OVERFLOW")
    echo: bool = Field(default=False, env="DB_ECHO")
    
    @property
    def url(self) -> str:
        """Get database URL"""
        return f"postgresql://{self.user}:{self.password.get_secret_value()}@{self.host}:{self.port}/{self.name}"
    
    class Config:
        env_prefix = "DB_"

class RedisConfig(BaseSettings):
    """Redis configuration"""
    host: str = Field(default="localhost", env="REDIS_HOST")
    port: int = Field(default=6379, env="REDIS_PORT")
    password: Optional[SecretStr] = Field(None, env="REDIS_PASSWORD")
    db: int = Field(default=0, env="REDIS_DB")
    decode_responses: bool = Field(default=True)
    max_connections: int = Field(default=50)
    
    @property
    def url(self) -> str:
        """Get Redis URL"""
        if self.password:
            return f"redis://:{self.password.get_secret_value()}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"
    
    class Config:
        env_prefix = "REDIS_"

class APIConfig(BaseSettings):
    """API configuration"""
    host: str = Field(default="0.0.0.0", env="API_HOST")
    port: int = Field(default=8000, env="API_PORT")
    workers: int = Field(default=4, env="API_WORKERS")
    reload: bool = Field(default=False, env="API_RELOAD")
    cors_origins: List[str] = Field(default=["*"], env="API_CORS_ORIGINS")
    title: str = Field(default="Aurora AI Empire API")
    version: str = Field(default="2.0.0")
    docs_url: Optional[str] = Field(default="/docs")
    
    class Config:
        env_prefix = "API_"

class SecurityConfig(BaseSettings):
    """Security configuration"""
    secret_key: SecretStr = Field(default_factory=lambda: SecretStr(secrets.token_urlsafe(64)), env="SECRET_KEY")
    jwt_secret: SecretStr = Field(default_factory=lambda: SecretStr(secrets.token_urlsafe(32)), env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expiration_minutes: int = Field(default=30)
    session_secret: SecretStr = Field(default_factory=lambda: SecretStr(secrets.token_urlsafe(32)), env="SESSION_SECRET")
    session_timeout: int = Field(default=3600)
    password_min_length: int = Field(default=8)
    max_login_attempts: int = Field(default=5)
    lockout_duration_minutes: int = Field(default=15)
    
    class Config:
        env_prefix = "SECURITY_"

class AIConfig(BaseSettings):
    """AI services configuration"""
    openai_api_key: Optional[SecretStr] = Field(None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[SecretStr] = Field(None, env="ANTHROPIC_API_KEY")
    default_model: str = Field(default="gpt-4", env="AI_DEFAULT_MODEL")
    temperature: float = Field(default=0.7, env="AI_TEMPERATURE")
    max_tokens: int = Field(default=2000, env="AI_MAX_TOKENS")
    embedding_model: str = Field(default="text-embedding-ada-002")
    embedding_dimensions: int = Field(default=1536)
    cache_embeddings: bool = Field(default=True)
    
    class Config:
        env_prefix = "AI_"

class GPUConfig(BaseSettings):
    """GPU configuration"""
    enabled: bool = Field(default=True, env="GPU_ENABLED")
    count: int = Field(default=-1, env="GPU_COUNT")  # -1 means all available
    memory_fraction: float = Field(default=0.9, env="GPU_MEMORY_FRACTION")
    mesh_enabled: bool = Field(default=False, env="GPU_MESH_ENABLED")
    mesh_peers: List[str] = Field(default=[], env="GPU_MESH_PEERS")
    
    class Config:
        env_prefix = "GPU_"

class FeatureFlags(BaseSettings):
    """Feature flags for enabling/disabling functionality"""
    gpu_mesh: bool = Field(default=True, env="FEATURE_GPU_MESH")
    natural_sql: bool = Field(default=True, env="FEATURE_NATURAL_SQL")
    risk_assessment: bool = Field(default=True, env="FEATURE_RISK_ASSESSMENT")
    character_cards: bool = Field(default=True, env="FEATURE_CHARACTER_CARDS")
    bbs_interface: bool = Field(default=False, env="FEATURE_BBS_INTERFACE")
    town_system: bool = Field(default=False, env="FEATURE_TOWN_SYSTEM")
    vengeance_mode: bool = Field(default=True, env="FEATURE_VENGEANCE_MODE")
    dual_llm: bool = Field(default=True, env="FEATURE_DUAL_LLM")
    
    class Config:
        env_prefix = "FEATURE_"

class MonitoringConfig(BaseSettings):
    """Monitoring configuration"""
    enabled: bool = Field(default=True, env="MONITORING_ENABLED")
    prometheus_enabled: bool = Field(default=True, env="PROMETHEUS_ENABLED")
    prometheus_port: int = Field(default=9090, env="PROMETHEUS_PORT")
    grafana_enabled: bool = Field(default=False, env="GRAFANA_ENABLED")
    grafana_port: int = Field(default=3001, env="GRAFANA_PORT")
    grafana_password: Optional[SecretStr] = Field(None, env="GRAFANA_PASSWORD")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    
    class Config:
        env_prefix = "MONITORING_"

class NodeConfig(BaseSettings):
    """Node-specific configuration"""
    node_name: str = Field(default="aurora", env="RUNPOD_NODE")
    node_role: NodeRole = Field(default=NodeRole.PRIMARY, env="AURORA_ROLE")
    gpu_config: str = Field(default="2xRTX4090", env="GPU_CONFIG")
    deployment_id: Optional[str] = Field(None, env="DEPLOYMENT_ID")
    cluster_peers: List[str] = Field(default=[], env="CLUSTER_PEERS")
    
    class Config:
        env_prefix = ""

# ============================================
# MAIN SETTINGS CLASS
# ============================================

class Settings(BaseSettings):
    """Main settings class that combines all configurations"""
    
    # Environment
    environment: Environment = Field(default=Environment.DEVELOPMENT, env="NODE_ENV")
    debug: bool = Field(default=False, env="DEBUG")
    testing: bool = Field(default=False, env="TESTING")
    
    # Sub-configurations
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)
    api: APIConfig = Field(default_factory=APIConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    ai: AIConfig = Field(default_factory=AIConfig)
    gpu: GPUConfig = Field(default_factory=GPUConfig)
    features: FeatureFlags = Field(default_factory=FeatureFlags)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)
    node: NodeConfig = Field(default_factory=NodeConfig)
    
    # Paths
    base_dir: Path = Field(default_factory=lambda: Path("/workspace/aurora"))
    data_dir: Path = Field(default_factory=lambda: Path("/workspace/aurora/data"))
    logs_dir: Path = Field(default_factory=lambda: Path("/workspace/aurora/logs"))
    models_dir: Path = Field(default_factory=lambda: Path("/workspace/aurora/models"))
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"
        
    @validator("environment", pre=True)
    def validate_environment(cls, v):
        """Validate and normalize environment"""
        if isinstance(v, str):
            v = v.lower()
            if v in ["dev", "development"]:
                return Environment.DEVELOPMENT
            elif v in ["prod", "production"]:
                return Environment.PRODUCTION
            elif v in ["stage", "staging"]:
                return Environment.STAGING
            elif v in ["test", "testing"]:
                return Environment.TESTING
        return v
    
    @validator("debug", always=True)
    def set_debug_from_env(cls, v, values):
        """Set debug based on environment"""
        if "environment" in values:
            if values["environment"] == Environment.DEVELOPMENT:
                return True
            elif values["environment"] == Environment.PRODUCTION:
                return False
        return v
    
    def get_node_config(self) -> Dict[str, Any]:
        """Get node-specific configuration"""
        return {
            "name": self.node.node_name,
            "role": self.node.node_role.value,
            "gpu": self.node.gpu_config,
            "deployment_id": self.node.deployment_id,
            "peers": self.node.cluster_peers
        }
    
    def get_enabled_features(self) -> List[str]:
        """Get list of enabled features"""
        enabled = []
        for feature, is_enabled in self.features.dict().items():
            if is_enabled:
                enabled.append(feature)
        return enabled
    
    def to_env_file(self, path: Optional[Path] = None) -> None:
        """Export settings to .env file"""
        if path is None:
            path = self.base_dir / f".env.{self.node.node_name}"
        
        env_lines = []
        
        # Flatten all settings
        def flatten_dict(d: dict, prefix: str = "") -> dict:
            items = {}
            for k, v in d.items():
                new_key = f"{prefix}{k}".upper() if prefix else k.upper()
                if isinstance(v, dict):
                    items.update(flatten_dict(v, f"{new_key}_"))
                elif isinstance(v, SecretStr):
                    items[new_key] = v.get_secret_value()
                elif isinstance(v, (list, tuple)):
                    items[new_key] = ",".join(str(x) for x in v)
                elif isinstance(v, Enum):
                    items[new_key] = v.value
                elif isinstance(v, Path):
                    items[new_key] = str(v)
                elif v is not None:
                    items[new_key] = str(v)
            return items
        
        flat_settings = flatten_dict(self.dict())
        
        for key, value in flat_settings.items():
            env_lines.append(f"{key}={value}")
        
        with open(path, "w") as f:
            f.write("\n".join(env_lines))
        
        logger.info(f"Settings exported to {path}")
    
    def validate_configuration(self) -> List[str]:
        """Validate configuration and return any warnings"""
        warnings = []
        
        # Check AI keys
        if not self.ai.openai_api_key and not self.ai.anthropic_api_key:
            warnings.append("No AI API keys configured")
        
        # Check database password
        if self.database.password.get_secret_value() == "change_me":
            warnings.append("Using default database password - change in production!")
        
        # Check security keys
        if len(self.security.secret_key.get_secret_value()) < 32:
            warnings.append("Secret key should be at least 32 characters")
        
        # Check production settings
        if self.environment == Environment.PRODUCTION:
            if self.debug:
                warnings.append("Debug mode enabled in production!")
            if self.api.docs_url:
                warnings.append("API docs exposed in production")
            if "*" in self.api.cors_origins:
                warnings.append("CORS allows all origins in production")
        
        return warnings

# ============================================
# SINGLETON PATTERN
# ============================================

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    settings = Settings()
    
    # Validate configuration
    warnings = settings.validate_configuration()
    if warnings:
        for warning in warnings:
            logger.warning(f"Configuration warning: {warning}")
    
    # Create required directories
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.logs_dir.mkdir(parents=True, exist_ok=True)
    settings.models_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Settings loaded for {settings.environment.value} environment")
    logger.info(f"Node: {settings.node.node_name} ({settings.node.node_role.value})")
    logger.info(f"Enabled features: {', '.join(settings.get_enabled_features())}")
    
    return settings

# ============================================
# CONFIGURATION MANAGEMENT
# ============================================

class ConfigurationManager:
    """Manage configuration across the cluster"""
    
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
    
    def sync_to_database(self) -> None:
        """Sync configuration to database for cluster-wide access"""
        # Implementation would sync to system_config table
        pass
    
    def load_from_database(self) -> Dict[str, Any]:
        """Load configuration from database"""
        # Implementation would load from system_config table
        pass
    
    def update_setting(self, key: str, value: Any) -> None:
        """Update a specific setting"""
        # Implementation would update both local and database
        pass
    
    def get_node_settings(self, node_name: str) -> Dict[str, Any]:
        """Get settings for a specific node"""
        # Implementation would return node-specific configuration
        pass

# ============================================
# EXPORTS
# ============================================

__all__ = [
    "Settings",
    "get_settings",
    "ConfigurationManager",
    "Environment",
    "NodeRole",
    "DatabaseConfig",
    "RedisConfig",
    "APIConfig",
    "SecurityConfig",
    "AIConfig",
    "GPUConfig",
    "FeatureFlags",
    "MonitoringConfig",
    "NodeConfig"
]

