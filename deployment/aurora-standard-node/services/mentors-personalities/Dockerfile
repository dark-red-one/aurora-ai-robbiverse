FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service files
COPY mentors_service.py .
COPY mentors_data.json .
COPY allan_maverick_config.json .
COPY healthcheck.py .

# Expose API
EXPOSE 8006

# Run service
CMD ["uvicorn", "mentors_service:app", "--host", "0.0.0.0", "--port", "8006"]
