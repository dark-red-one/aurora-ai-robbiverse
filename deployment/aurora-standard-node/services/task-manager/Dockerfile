FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy task manager
COPY task_manager.py .
COPY healthcheck.py .

# Expose API
EXPOSE 3008

# Run task manager
CMD ["python", "task_manager.py"]
