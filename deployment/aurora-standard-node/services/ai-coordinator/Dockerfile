FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI coordinator
COPY coordinator.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3010

# Run AI coordinator
CMD ["python", "coordinator.py"]
