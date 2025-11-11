# Dockerfile for AgentAI (FastAPI) Service
FROM python:3.11-slim

# Install system deps (build + mysql client libs optional)
RUN apt-get update && apt-get install -y build-essential default-mysql-client curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency metadata first for layer caching
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py ./app.py
COPY fallbacks/ ./fallbacks/

# Non-root user for security
RUN useradd -m agent && chown -R agent:agent /app
USER agent

ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    SERVICE_ROLE=agentai \
    DB_HOST=mysql \
    DB_PORT=3306 \
    DB_USER=root \
    DB_NAME=air_bnb

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fs http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
