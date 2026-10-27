# Step 1: Build the Next.js static frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
# Build with relative NEXT_PUBLIC_API_URL to automatically target host domain
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Step 2: Package the Python FastAPI backend and serve static files
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY app.py .
COPY templates/ templates/
COPY static/ static/

# Copy static frontend export out folder to /app/frontend/out
COPY --from=frontend-builder /frontend/out ./frontend/out

# Create upload and database storage directories
RUN mkdir -p /app/storage /root/.pdf_chatbot_uploads

# Set environment defaults
ENV PORT=7860
EXPOSE 7860

# Start FastAPI server on dynamic PORT
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
