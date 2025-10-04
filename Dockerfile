# Aurora AI Empire - Multi-Stage Production Container
# Optimized for production deployment across all 3 RunPods

# Stage 1: Base Image with System Dependencies
FROM ubuntu:22.04 as base

# Prevent interactive prompts during build
ARG DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    postgresql-client \
    nginx \
    curl \
    wget \
    git \
    vim \
    htop \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Python Dependencies
FROM base as python-deps

WORKDIR /app

# Copy Python requirements
COPY requirements.txt ./

# Create virtual environment and install dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 3: Node.js Dependencies
FROM base as node-deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 4: Production Image
FROM base as production

# Create non-root user for security
RUN groupadd -r aurora && useradd -r -g aurora aurora

# Set up working directory
WORKDIR /app

# Copy Python dependencies from python-deps stage
COPY --from=python-deps /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Node.js dependencies from node-deps stage
COPY --from=node-deps /app/node_modules ./node_modules

# Copy application code
COPY src/ ./src/
COPY backend/ ./backend/
COPY database/ ./database/
COPY data/ ./data/
COPY scripts/ ./scripts/
COPY *.js ./
COPY *.sh ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/tmp && \
    chown -R aurora:aurora /app

# Configure nginx for reverse proxy
COPY nginx.conf /etc/nginx/nginx.conf

# Set up proper permissions
RUN chmod +x *.sh && \
    chown -R aurora:aurora /app

# Switch to non-root user
USER aurora

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000 3000 5432 80

# Start command
CMD ["/app/start_aurora_container.sh"]
