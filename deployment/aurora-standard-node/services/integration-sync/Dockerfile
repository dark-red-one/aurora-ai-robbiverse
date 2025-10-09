FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy sync engine
COPY sync_engine.py .
COPY config.py .
COPY healthcheck.py .

# Run sync engine
CMD ["python", "-u", "sync_engine.py"]
