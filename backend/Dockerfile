# --- Stage 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies (Postgres client, build tools)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# --- Stage 2: Production Runner ---
FROM python:3.11-slim AS runner

WORKDIR /app

# Install psql and libpq for runtime
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python from builder
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy app code
COPY . .

# Collect static files (optional)
RUN python manage.py collectstatic --noinput || true

# Expose port and run Django
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
