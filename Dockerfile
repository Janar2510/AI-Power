# ERP Platform - Production Docker image (Phase 99)
FROM python:3.11-slim

# Install PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Default: run server
CMD ["./erp-bin", "server"]
