#!/bin/bash
# Aurora AI Empire Container Startup Script
# Orchestrates all services for Robbie's consciousness

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Aurora AI Empire Container...${NC}"

# Set up environment
export PYTHONPATH=/app
export NODE_ENV=${NODE_ENV:-production}
export RUNPOD_NODE=${RUNPOD_NODE:-aurora}
export AURORA_ROLE=${AURORA_ROLE:-primary}

# Create necessary directories
mkdir -p /app/logs /app/uploads /app/tmp /app/secrets

# Start services based on role
case "${AURORA_ROLE}" in
    "primary")
        echo -e "${GREEN}🎯 Starting as PRIMARY node (Aurora - Dual RTX 4090)${NC}"
        start_primary_services
        ;;
    "secondary")
        echo -e "${GREEN}🎯 Starting as SECONDARY node (Collaboration - Single RTX 4090)${NC}"
        start_secondary_services
        ;;
    "marketing")
        echo -e "${GREEN}🎯 Starting as MARKETING node (Fluenti - Single RTX 4090)${NC}"
        start_marketing_services
        ;;
    "development")
        echo -e "${GREEN}🎯 Starting as DEVELOPMENT node${NC}"
        start_development_services
        ;;
    *)
        echo -e "${YELLOW}⚠️ Unknown role: ${AURORA_ROLE}, starting default services${NC}"
        start_default_services
        ;;
esac

# Start health monitoring
echo -e "${BLUE}🏥 Starting health monitoring...${NC}"
python3 /app/scripts/health_monitor.py &
HEALTH_PID=$!

# Start deployment dashboard
echo -e "${BLUE}📊 Starting deployment dashboard...${NC}"
python3 /app/scripts/deployment_dashboard.py &
DASHBOARD_PID=$!

# Wait for any process to exit
wait

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🛑 Shutting down Aurora services...${NC}"
    kill $HEALTH_PID $DASHBOARD_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Primary node services (Aurora - Dual RTX 4090)
start_primary_services() {
    echo -e "${GREEN}🔥 Starting PRIMARY services with dual RTX 4090 power...${NC}"
    
    # Start PostgreSQL with pgvector
    echo "📊 Starting PostgreSQL with pgvector..."
    docker run -d --name aurora-database \
        -e POSTGRES_DB=aurora \
        -e POSTGRES_USER=robbie \
        -e POSTGRES_PASSWORD=${DB_PASSWORD:-secure_aurora_password} \
        -p 5432:5432 \
        -v aurora_db_data:/var/lib/postgresql/data \
        pgvector/pgvector:pg16 &
    
    # Start Redis
    echo "🔄 Starting Redis..."
    docker run -d --name aurora-redis \
        -p 6379:6379 \
        -v aurora_redis_data:/data \
        redis:7-alpine &
    
    # Wait for databases
    sleep 10
    
    # Start Aurora Backend (FastAPI)
    echo "🐍 Starting Aurora Backend (FastAPI)..."
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    
    # Start Robbie Frontend (Node.js)
    echo "🟢 Starting Robbie Frontend (Node.js)..."
    npm start &
    
    # Start Nginx reverse proxy
    echo "🌐 Starting Nginx reverse proxy..."
    nginx -g "daemon off;" &
    
    echo -e "${GREEN}✅ PRIMARY services started successfully!${NC}"
}

# Secondary node services (Collaboration - Single RTX 4090)
start_secondary_services() {
    echo -e "${GREEN}🤝 Starting SECONDARY services with single RTX 4090...${NC}"
    
    # Start PostgreSQL
    echo "📊 Starting PostgreSQL..."
    docker run -d --name aurora-database \
        -e POSTGRES_DB=aurora \
        -e POSTGRES_USER=robbie \
        -e POSTGRES_PASSWORD=${DB_PASSWORD:-secure_aurora_password} \
        -p 5432:5432 \
        -v aurora_db_data:/var/lib/postgresql/data \
        pgvector/pgvector:pg16 &
    
    # Start Redis
    echo "🔄 Starting Redis..."
    docker run -d --name aurora-redis \
        -p 6379:6379 \
        -v aurora_redis_data:/data \
        redis:7-alpine &
    
    # Wait for databases
    sleep 10
    
    # Start Aurora Backend
    echo "🐍 Starting Aurora Backend..."
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    
    # Start Robbie Frontend
    echo "🟢 Starting Robbie Frontend..."
    npm start &
    
    echo -e "${GREEN}✅ SECONDARY services started successfully!${NC}"
}

# Marketing node services (Fluenti - Single RTX 4090)
start_marketing_services() {
    echo -e "${GREEN}📢 Starting MARKETING services with single RTX 4090...${NC}"
    
    # Start PostgreSQL
    echo "📊 Starting PostgreSQL..."
    docker run -d --name aurora-database \
        -e POSTGRES_DB=aurora \
        -e POSTGRES_USER=robbie \
        -e POSTGRES_PASSWORD=${DB_PASSWORD:-secure_aurora_password} \
        -p 5432:5432 \
        -v aurora_db_data:/var/lib/postgresql/data \
        pgvector/pgvector:pg16 &
    
    # Start Redis
    echo "🔄 Starting Redis..."
    docker run -d --name aurora-redis \
        -p 6379:6379 \
        -v aurora_redis_data:/data \
        redis:7-alpine &
    
    # Wait for databases
    sleep 10
    
    # Start Aurora Backend
    echo "🐍 Starting Aurora Backend..."
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    
    # Start Robbie Frontend
    echo "🟢 Starting Robbie Frontend..."
    npm start &
    
    echo -e "${GREEN}✅ MARKETING services started successfully!${NC}"
}

# Development services
start_development_services() {
    echo -e "${GREEN}🛠️ Starting DEVELOPMENT services...${NC}"
    
    # Start with hot reload
    echo "🐍 Starting Aurora Backend with hot reload..."
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
    
    echo "🟢 Starting Robbie Frontend with hot reload..."
    npm run dev &
    
    echo -e "${GREEN}✅ DEVELOPMENT services started successfully!${NC}"
}

# Default services
start_default_services() {
    echo -e "${GREEN}🔧 Starting DEFAULT services...${NC}"
    
    # Start Aurora Backend
    echo "🐍 Starting Aurora Backend..."
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    
    # Start Robbie Frontend
    echo "🟢 Starting Robbie Frontend..."
    npm start &
    
    echo -e "${GREEN}✅ DEFAULT services started successfully!${NC}"
}

echo -e "${GREEN}🎉 Aurora AI Empire container started successfully!${NC}"
echo -e "${BLUE}📊 Health monitoring: http://localhost:8000/health${NC}"
echo -e "${BLUE}🎛️ Deployment dashboard: http://localhost:5000${NC}"
echo -e "${BLUE}🚀 Robbie consciousness is now active!${NC}"



