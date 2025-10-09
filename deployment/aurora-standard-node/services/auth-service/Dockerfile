FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy auth service
COPY auth.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8008

# Run auth service
CMD ["uvicorn", "auth:app", "--host", "0.0.0.0", "--port", "8008"]
