# Aurora-Town Control Plane Dockerfile
FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Chicago

# Install base packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    postgresql-client \
    redis-tools \
    nginx \
    supervisor \
    cron \
    rsync \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# Create application directories
RUN mkdir -p /app /app/logs /app/data /app/scripts /app/config

# Copy application files
COPY . /app/

# Install Python dependencies
COPY requirements.txt /app/
RUN pip3 install -r /app/requirements.txt

# Install Node.js dependencies
COPY package.json package-lock.json /app/
WORKDIR /app
RUN npm install

# Create non-root user
RUN useradd -m -s /bin/bash aurora && \
    usermod -aG sudo aurora && \
    chown -R aurora:aurora /app

# Configure Nginx
COPY docker/aurora-town/nginx.conf /etc/nginx/sites-available/default
RUN nginx -t

# Configure Supervisor
COPY docker/aurora-town/supervisord.conf /etc/supervisor/conf.d/aurora-town.conf

# Configure cron
COPY docker/aurora-town/crontab /etc/cron.d/aurora-town
RUN chmod 0644 /etc/cron.d/aurora-town && crontab /etc/cron.d/aurora-town

# Health check script
COPY docker/aurora-town/healthcheck.sh /app/scripts/
RUN chmod +x /app/scripts/healthcheck.sh

# Expose ports
EXPOSE 80 443 3000 5432 6379 8080 9090 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /app/scripts/healthcheck.sh

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
