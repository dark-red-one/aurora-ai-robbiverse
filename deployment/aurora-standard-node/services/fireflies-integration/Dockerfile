FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Fireflies integration
COPY fireflies_bot.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3005

# Run Fireflies bot
CMD ["python", "fireflies_bot.py"]
