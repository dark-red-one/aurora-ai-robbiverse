FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy gatekeeper service
COPY gatekeeper.py .
COPY safety_rules.json .
COPY healthcheck.py .

# Expose API
EXPOSE 8004

# Run gatekeeper
CMD ["uvicorn", "gatekeeper:app", "--host", "0.0.0.0", "--port", "8004"]
