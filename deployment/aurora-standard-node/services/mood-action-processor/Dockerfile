FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy mood action processor
COPY mood_action_processor.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3007

# Run mood action processor
CMD ["python", "mood_action_processor.py"]
