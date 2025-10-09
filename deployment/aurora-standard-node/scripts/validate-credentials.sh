#!/bin/bash

# Credential Validation Script
# Checks all required credentials and data before deployment

set -euo pipefail

echo "🔍 Validating Aurora credentials and data..."
echo "============================================="

# Load environment variables
if [[ -f .env ]]; then
    source .env
else
    echo "❌ .env file not found. Run ./scripts/deploy-aurora.sh first."
    exit 1
fi

# Validation functions
validate_required() {
    local var_name=$1
    local var_value=$2
    local description=$3
    
    if [[ -z "${var_value:-}" || "$var_value" == "your-*-key" || "$var_value" == "your-*-password" ]]; then
        echo "❌ $description: $var_name is not set or using placeholder"
        return 1
    else
        echo "✅ $description: $var_name is set"
        return 0
    fi
}

validate_file() {
    local file_path=$1
    local description=$2
    
    if [[ -f "$file_path" ]]; then
        echo "✅ $description: $file_path exists"
        return 0
    else
        echo "❌ $description: $file_path not found"
        return 1
    fi
}

validate_url() {
    local url=$1
    local description=$2
    
    if curl -s --head "$url" > /dev/null 2>&1; then
        echo "✅ $description: $url is reachable"
        return 0
    else
        echo "❌ $description: $url is not reachable"
        return 1
    fi
}

# Track validation results
errors=0

echo ""
echo "📋 Required Environment Variables:"
echo "----------------------------------"

# Database credentials
validate_required "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD" "PostgreSQL password" || ((errors++))
validate_required "REDIS_PASSWORD" "$REDIS_PASSWORD" "Redis password" || ((errors++))
validate_required "JWT_SECRET" "$JWT_SECRET" "JWT secret" || ((errors++))

# API Keys (optional but recommended)
echo ""
echo "🔑 API Keys (Optional but Recommended):"
echo "---------------------------------------"

if validate_required "HUBSPOT_API_KEY" "${HUBSPOT_API_KEY:-}" "HubSpot API key"; then
    # Test HubSpot connection
    if curl -s -H "Authorization: Bearer $HUBSPOT_API_KEY" "https://api.hubapi.com/crm/v3/objects/contacts?limit=1" > /dev/null 2>&1; then
        echo "✅ HubSpot API: Connection successful"
    else
        echo "⚠️ HubSpot API: Key provided but connection failed"
    fi
else
    echo "⚠️ HubSpot API: Not configured (optional)"
fi

if validate_required "SLACK_BOT_TOKEN" "${SLACK_BOT_TOKEN:-}" "Slack bot token"; then
    # Test Slack connection
    if curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" "https://slack.com/api/auth.test" | grep -q '"ok":true'; then
        echo "✅ Slack API: Connection successful"
    else
        echo "⚠️ Slack API: Token provided but connection failed"
    fi
else
    echo "⚠️ Slack API: Not configured (optional)"
fi

if validate_required "GITHUB_TOKEN" "${GITHUB_TOKEN:-}" "GitHub token"; then
    # Test GitHub connection
    if curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user" | grep -q '"login"'; then
        echo "✅ GitHub API: Connection successful"
    else
        echo "⚠️ GitHub API: Token provided but connection failed"
    fi
else
    echo "⚠️ GitHub API: Not configured (optional)"
fi

# SMTP Configuration
echo ""
echo "📧 SMTP Configuration:"
echo "----------------------"

if validate_required "SMTP_USERNAME" "${SMTP_USERNAME:-}" "SMTP username"; then
    validate_required "SMTP_PASSWORD" "${SMTP_PASSWORD:-}" "SMTP password" || ((errors++))
    validate_required "SMTP_HOST" "${SMTP_HOST:-}" "SMTP host" || ((errors++))
    validate_required "SMTP_PORT" "${SMTP_PORT:-}" "SMTP port" || ((errors++))
    
    # Test SMTP connection
    if command -v swaks > /dev/null 2>&1; then
        if echo "Test email" | swaks --to "$SMTP_FROM_EMAIL" --from "$SMTP_FROM_EMAIL" --server "$SMTP_HOST:$SMTP_PORT" --auth-user "$SMTP_USERNAME" --auth-password "$SMTP_PASSWORD" --tls > /dev/null 2>&1; then
            echo "✅ SMTP: Connection successful"
        else
            echo "⚠️ SMTP: Credentials provided but connection failed"
        fi
    else
        echo "⚠️ SMTP: swaks not installed, cannot test connection"
    fi
else
    echo "⚠️ SMTP: Not configured (optional)"
fi

# Google Workspace (if configured)
echo ""
echo "🔗 Google Workspace:"
echo "--------------------"

if [[ -n "${GOOGLE_CREDENTIALS_JSON:-}" && "$GOOGLE_CREDENTIALS_JSON" != "your-google-credentials" ]]; then
    if [[ -f "$GOOGLE_CREDENTIALS_JSON" ]]; then
        echo "✅ Google credentials: File exists"
        # Test Google API connection
        if python3 -c "
import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

try:
    creds = service_account.Credentials.from_service_account_file('$GOOGLE_CREDENTIALS_JSON')
    service = build('gmail', 'v1', credentials=creds)
    service.users().getProfile(userId='me').execute()
    print('✅ Google API: Connection successful')
except Exception as e:
    print(f'⚠️ Google API: Connection failed - {e}')
" 2>/dev/null; then
            echo "✅ Google API: Connection successful"
        else
            echo "⚠️ Google API: Credentials file exists but connection failed"
        fi
    else
        echo "❌ Google credentials: File not found at $GOOGLE_CREDENTIALS_JSON"
        ((errors++))
    fi
else
    echo "⚠️ Google Workspace: Not configured (optional)"
fi

# Required Files
echo ""
echo "📁 Required Files:"
echo "------------------"

validate_file "docker-compose.yml" "Docker Compose file" || ((errors++))
validate_file "services/web-frontend/nginx.conf" "Nginx configuration" || ((errors++))
validate_file "database/unified-schema/10-extensions.sql" "Database migrations" || ((errors++))
validate_file "config/sentinel-aurora.conf" "Redis Sentinel config" || ((errors++))

# SSL Certificates
echo ""
echo "🔐 SSL Certificates:"
echo "--------------------"

if validate_file "services/web-frontend/ssl/aurora.crt" "Aurora SSL certificate"; then
    validate_file "services/web-frontend/ssl/aurora.key" "Aurora SSL private key" || ((errors++))
    echo "✅ SSL: Self-signed certificates ready"
else
    echo "⚠️ SSL: No certificates found, will generate self-signed"
fi

# Network Configuration
echo ""
echo "🌐 Network Configuration:"
echo "-------------------------"

validate_required "NODE_NAME" "$NODE_NAME" "Node name" || ((errors++))
validate_required "VPN_IP" "$VPN_IP" "VPN IP address" || ((errors++))

# Test Aurora connectivity
if validate_url "http://aurora-town-u44170.vm.elestio.app" "Aurora server"; then
    echo "✅ Aurora server: Reachable"
else
    echo "⚠️ Aurora server: Not reachable (may be normal if not deployed yet)"
fi

# Summary
echo ""
echo "📊 Validation Summary:"
echo "======================"

if [[ $errors -eq 0 ]]; then
    echo "✅ All required credentials and data are ready!"
    echo "🚀 Ready to deploy Aurora"
    exit 0
else
    echo "❌ $errors validation errors found"
    echo ""
    echo "🔧 To fix missing credentials:"
    echo "1. Edit .env file with your actual API keys"
    echo "2. Run ./scripts/generate-ssl-certs.sh for SSL certificates"
    echo "3. Run ./scripts/validate-credentials.sh again"
    exit 1
fi
