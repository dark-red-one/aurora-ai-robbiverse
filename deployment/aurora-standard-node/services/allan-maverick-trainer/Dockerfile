FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy trainer
COPY trainer.py .
COPY data_collector.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8011

# Run trainer
CMD ["python", "trainer.py"]
