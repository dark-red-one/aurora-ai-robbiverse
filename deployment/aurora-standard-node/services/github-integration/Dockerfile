FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy GitHub integration
COPY github_bot.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3004

# Run GitHub bot
CMD ["python", "github_bot.py"]
