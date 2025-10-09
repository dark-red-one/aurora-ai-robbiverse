FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Slack integration
COPY slack_bot.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3003

# Run Slack bot
CMD ["python", "slack_bot.py"]
