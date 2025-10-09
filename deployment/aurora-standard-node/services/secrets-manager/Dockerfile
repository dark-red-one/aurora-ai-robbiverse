FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy secrets manager
COPY secrets_manager.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8003

# Run secrets manager
CMD ["uvicorn", "secrets_manager:app", "--host", "0.0.0.0", "--port", "8003"]
