FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy router service
COPY router.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8007

# Run agent router
CMD ["uvicorn", "router:app", "--host", "0.0.0.0", "--port", "8007"]
