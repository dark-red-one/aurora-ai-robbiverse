FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy RobbieBlocks API
COPY api.py .
COPY healthcheck.py .

# Expose API
EXPOSE 8009

# Run RobbieBlocks API
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8009"]
