FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy priority engine
COPY priority_engine.py .
COPY eisenhower.py .
COPY config.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8002

# Run priority engine
CMD ["uvicorn", "priority_engine:app", "--host", "0.0.0.0", "--port", "8002"]
