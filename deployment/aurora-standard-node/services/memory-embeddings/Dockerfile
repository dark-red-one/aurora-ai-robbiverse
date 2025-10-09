FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy memory & embeddings service
COPY memory_service.py .
COPY embeddings_engine.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8005

# Run memory service
CMD ["uvicorn", "memory_service:app", "--host", "0.0.0.0", "--port", "8005"]
