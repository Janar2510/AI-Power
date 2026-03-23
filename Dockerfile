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

# Optional multi-stage: FROM node:20-alpine AS webbuild → WORKDIR /src COPY package.json ./
# RUN npm install && npm run check:assets-concat && npm run build:web
# then in this stage COPY --from=webbuild /src/addons/web/static/dist ./addons/web/static/dist

# Default: run server
CMD ["./erp-bin", "server"]
