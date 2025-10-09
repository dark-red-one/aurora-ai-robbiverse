FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy training scheduler
COPY scheduler.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8010

# Run training scheduler
CMD ["uvicorn", "scheduler:app", "--host", "0.0.0.0", "--port", "8010"]
