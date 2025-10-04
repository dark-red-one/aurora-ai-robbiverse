#!/usr/bin/env python3
"""
Aurora Secrets Management System
Secure handling of secrets across all environments
"""

import os
import json
import base64
import logging
from typing import Dict, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class AuroraSecretsManager:
    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.secrets_file = f"/app/secrets/{environment}_secrets.json"
        self.encryption_key = self._get_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        
        # AWS Secrets Manager (if configured)
        self.aws_secrets_client = None
        if os.getenv('AWS_ACCESS_KEY_ID'):
            try:
                self.aws_secrets_client = boto3.client('secretsmanager')
            except Exception as e:
                logger.warning(f"AWS Secrets Manager not available: {e}")
    
    def _get_encryption_key(self) -> bytes:
        """Get or generate encryption key for local secrets"""
        key_file = f"/app/secrets/{self.environment}_key.key"
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            os.makedirs(os.path.dirname(key_file), exist_ok=True)
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
    
    def _encrypt_secret(self, secret: str) -> str:
        """Encrypt a secret value"""
        return self.cipher.encrypt(secret.encode()).decode()
    
    def _decrypt_secret(self, encrypted_secret: str) -> str:
        """Decrypt a secret value"""
        return self.cipher.decrypt(encrypted_secret.encode()).decode()
    
    def store_secret(self, key: str, value: str, use_aws: bool = False) -> bool:
        """Store a secret securely"""
        try:
            if use_aws and self.aws_secrets_client:
                return self._store_aws_secret(key, value)
            else:
                return self._store_local_secret(key, value)
        except Exception as e:
            logger.error(f"Failed to store secret {key}: {e}")
            return False
    
    def _store_aws_secret(self, key: str, value: str) -> bool:
        """Store secret in AWS Secrets Manager"""
        try:
            secret_name = f"aurora/{self.environment}/{key}"
            
            # Check if secret exists
            try:
                self.aws_secrets_client.get_secret_value(SecretId=secret_name)
                # Update existing secret
                self.aws_secrets_client.update_secret(
                    SecretId=secret_name,
                    SecretString=value
                )
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    # Create new secret
                    self.aws_secrets_client.create_secret(
                        Name=secret_name,
                        SecretString=value,
                        Description=f"Aurora {self.environment} secret for {key}"
                    )
                else:
                    raise
            
            logger.info(f"✅ Secret {key} stored in AWS Secrets Manager")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store AWS secret {key}: {e}")
            return False
    
    def _store_local_secret(self, key: str, value: str) -> bool:
        """Store secret locally with encryption"""
        try:
            # Load existing secrets
            secrets = self._load_local_secrets()
            
            # Encrypt and store new secret
            secrets[key] = self._encrypt_secret(value)
            
            # Save back to file
            os.makedirs(os.path.dirname(self.secrets_file), exist_ok=True)
            with open(self.secrets_file, 'w') as f:
                json.dump(secrets, f, indent=2)
            
            # Set secure permissions
            os.chmod(self.secrets_file, 0o600)
            
            logger.info(f"✅ Secret {key} stored locally")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store local secret {key}: {e}")
            return False
    
    def get_secret(self, key: str, use_aws: bool = False) -> Optional[str]:
        """Retrieve a secret"""
        try:
            if use_aws and self.aws_secrets_client:
                return self._get_aws_secret(key)
            else:
                return self._get_local_secret(key)
        except Exception as e:
            logger.error(f"Failed to retrieve secret {key}: {e}")
            return None
    
    def _get_aws_secret(self, key: str) -> Optional[str]:
        """Retrieve secret from AWS Secrets Manager"""
        try:
            secret_name = f"aurora/{self.environment}/{key}"
            response = self.aws_secrets_client.get_secret_value(SecretId=secret_name)
            return response['SecretString']
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                logger.warning(f"Secret {key} not found in AWS")
            else:
                logger.error(f"Failed to retrieve AWS secret {key}: {e}")
            return None
    
    def _get_local_secret(self, key: str) -> Optional[str]:
        """Retrieve secret from local file"""
        try:
            secrets = self._load_local_secrets()
            if key in secrets:
                return self._decrypt_secret(secrets[key])
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve local secret {key}: {e}")
            return None
    
    def _load_local_secrets(self) -> Dict[str, str]:
        """Load secrets from local file"""
        if os.path.exists(self.secrets_file):
            with open(self.secrets_file, 'r') as f:
                return json.load(f)
        return {}
    
    def list_secrets(self) -> Dict[str, bool]:
        """List all available secrets"""
        secrets = {}
        
        # Check local secrets
        local_secrets = self._load_local_secrets()
        for key in local_secrets:
            secrets[f"local:{key}"] = True
        
        # Check AWS secrets (if available)
        if self.aws_secrets_client:
            try:
                response = self.aws_secrets_client.list_secrets(
                    Filters=[{'Key': 'name', 'Values': [f'aurora/{self.environment}/']}]
                )
                for secret in response['SecretList']:
                    key = secret['Name'].split('/')[-1]
                    secrets[f"aws:{key}"] = True
            except Exception as e:
                logger.warning(f"Failed to list AWS secrets: {e}")
        
        return secrets
    
    def delete_secret(self, key: str, use_aws: bool = False) -> bool:
        """Delete a secret"""
        try:
            if use_aws and self.aws_secrets_client:
                return self._delete_aws_secret(key)
            else:
                return self._delete_local_secret(key)
        except Exception as e:
            logger.error(f"Failed to delete secret {key}: {e}")
            return False
    
    def _delete_aws_secret(self, key: str) -> bool:
        """Delete secret from AWS Secrets Manager"""
        try:
            secret_name = f"aurora/{self.environment}/{key}"
            self.aws_secrets_client.delete_secret(
                SecretId=secret_name,
                ForceDeleteWithoutRecovery=True
            )
            logger.info(f"✅ Secret {key} deleted from AWS")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete AWS secret {key}: {e}")
            return False
    
    def _delete_local_secret(self, key: str) -> bool:
        """Delete secret from local file"""
        try:
            secrets = self._load_local_secrets()
            if key in secrets:
                del secrets[key]
                with open(self.secrets_file, 'w') as f:
                    json.dump(secrets, f, indent=2)
                logger.info(f"✅ Secret {key} deleted locally")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Failed to delete local secret {key}: {e}")
            return False

# Environment-specific secret configurations
ENVIRONMENT_SECRETS = {
    "development": {
        "DB_PASSWORD": "dev_password_123",
        "REDIS_PASSWORD": "dev_redis_123",
        "API_KEY": "dev_api_key_123",
        "JWT_SECRET": "dev_jwt_secret_123"
    },
    "staging": {
        "DB_PASSWORD": "staging_password_456",
        "REDIS_PASSWORD": "staging_redis_456", 
        "API_KEY": "staging_api_key_456",
        "JWT_SECRET": "staging_jwt_secret_456"
    },
    "production": {
        "DB_PASSWORD": "prod_password_789",
        "REDIS_PASSWORD": "prod_redis_789",
        "API_KEY": "prod_api_key_789", 
        "JWT_SECRET": "prod_jwt_secret_789"
    }
}

def initialize_environment_secrets(environment: str):
    """Initialize secrets for a specific environment"""
    manager = AuroraSecretsManager(environment)
    
    if environment in ENVIRONMENT_SECRETS:
        for key, value in ENVIRONMENT_SECRETS[environment].items():
            manager.store_secret(key, value)
        logger.info(f"✅ Initialized {environment} secrets")
    else:
        logger.error(f"❌ Unknown environment: {environment}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python secrets_manager.py <environment> [action] [key] [value]")
        sys.exit(1)
    
    environment = sys.argv[1]
    action = sys.argv[2] if len(sys.argv) > 2 else "list"
    
    manager = AuroraSecretsManager(environment)
    
    if action == "list":
        secrets = manager.list_secrets()
        for secret, available in secrets.items():
            print(f"{secret}: {'✅' if available else '❌'}")
    
    elif action == "get" and len(sys.argv) > 3:
        key = sys.argv[3]
        value = manager.get_secret(key)
        if value:
            print(f"{key}: {value}")
        else:
            print(f"Secret {key} not found")
    
    elif action == "set" and len(sys.argv) > 4:
        key = sys.argv[3]
        value = sys.argv[4]
        if manager.store_secret(key, value):
            print(f"✅ Secret {key} stored")
        else:
            print(f"❌ Failed to store secret {key}")
    
    elif action == "delete" and len(sys.argv) > 3:
        key = sys.argv[3]
        if manager.delete_secret(key):
            print(f"✅ Secret {key} deleted")
        else:
            print(f"❌ Failed to delete secret {key}")
    
    else:
        print("Invalid action. Use: list, get, set, or delete")



