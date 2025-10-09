FROM python:3.11-slim

WORKDIR /app

# Install Docker CLI for container inspection
RUN apt-get update && apt-get install -y \
    curl \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY monitor.py .

# Run monitor service
CMD ["python", "-u", "monitor.py"]
