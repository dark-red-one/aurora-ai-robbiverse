FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy offline queue service
COPY offline_queue.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3006

# Run offline queue service
CMD ["python", "offline_queue.py"]
