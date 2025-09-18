FROM python:3.10-slim

# Avoid interactive prompts and set sensible defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for building some packages (e.g., bcrypt), and runtime locales/ssl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    git \
  && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for better layer caching
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the application
COPY . .

# Create non-root user and persist DB/logs
RUN useradd -ms /bin/bash appuser \
  && mkdir -p /app/results /app/.cache \
  && chown -R appuser:appuser /app

USER appuser

# Default environment variables (can be overridden by docker-compose)
ENV WEB_SESSION_SECRET=change-me-in-env \
    WEB_DATABASE_URL=sqlite:///./web_data.db

# Expose uvicorn port
EXPOSE 8000

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:8000/health || exit 1

# Start the FastAPI app
CMD ["uvicorn", "web.server:app", "--host", "0.0.0.0", "--port", "8000"]


