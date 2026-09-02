# 47. Production Deployment & Operations Guide

## 1. Production Architecture Overview

The production deployment runs via containerized microservices managed via Docker Compose or Kubernetes:
- **FastAPI Core API**: 4+ Uvicorn async workers behind Nginx Reverse Proxy with TLS termination.
- **PostgreSQL 16**: Primary DB with connection pooling (PgBouncer) & WAL streaming.
- **Redis 7**: Distributed caching, token blacklists, event fanout, and celery task broker.
- **MinIO / S3**: Secure artwork storage with pre-signed upload/download links.
- **Celery Worker**: Asynchronous background jobs (costing calculations, notifications, imports).
- **Celery Beat**: Recurring schedules (capacity recalculations, stock alerts, nightly backups).

---

## 2. Environment Variables & Secret Configuration

Production secrets must never be committed to Git. Store in `.env.production` (loaded via Docker Secrets / Vault):

| Key | Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://app_user:pass@db:5432/officefloww_prod` | Async PostgreSQL connection string |
| `SECRET_KEY` | `09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7` | 256-bit JWT signing secret |
| `REDIS_URL` | `redis://redis:6379/0` | Cache and message queue connection |
| `STORAGE_PROVIDER` | `S3` | File storage backend (`LOCAL` or `S3`) |
| `AWS_ACCESS_KEY_ID` | `AKIAIOSFODNN7EXAMPLE` | S3 / MinIO access key |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | S3 / MinIO secret |
| `WHATSAPP_API_TOKEN` | `EAAG...` | Meta Cloud WhatsApp Business API token |
| `CORS_ORIGINS` | `https://app.officefloww.com` | Allowed CORS origins |

---

## 3. Deployment Steps

```bash
# 1. Clone repository & pull release tag
git clone https://github.com/logicbyroshan/officefloww.git /opt/officefloww
cd /opt/officefloww

# 2. Configure production secrets
cp .env.example .env.production
chmod 600 .env.production
vim .env.production

# 3. Pull & Build Docker Images
docker compose -f docker-compose.prod.yml build

# 4. Apply Database Migrations
docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head

# 5. Launch Full Stack
docker compose -f docker-compose.prod.yml up -d

# 6. Verify Service Status
docker compose -f docker-compose.prod.yml ps
curl -f https://api.officefloww.com/api/v1/health
```

---

## 4. Monitoring, Logging & Alerting

- **Application Logs**: JSON-structured logs with `correlation_id` written to stdout & Fluentbit.
- **Metrics**: Prometheus metrics exported at `/metrics` (request count, latencies, active DB connections).
- **Health Checks**:
  - Liveness probe: `GET /api/v1/health` (HTTP 200)
  - Readiness probe: `GET /api/v1/health/readiness` (validates PostgreSQL and Redis ping)
