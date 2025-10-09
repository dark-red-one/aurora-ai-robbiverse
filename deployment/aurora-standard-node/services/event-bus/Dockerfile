FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy event bus service
COPY event_broker.py .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import redis; r = redis.Redis(host='redis', port=6379, password='${REDIS_PASSWORD}'); r.ping()" || exit 1

# Run event broker
CMD ["python", "-u", "event_broker.py"]
