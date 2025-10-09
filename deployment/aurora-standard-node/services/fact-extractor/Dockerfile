FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy fact extractor
COPY fact_extractor.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3009

# Run fact extractor
CMD ["python", "fact_extractor.py"]
