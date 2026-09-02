# 12. Development Setup & Infrastructure - OfficeFloww

## Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+
- **Docker & Docker Compose** (for containerized PostgreSQL, Redis, MinIO)

---

## Local Development (Single Process / Quick Start)
You can run the API locally with SQLite and eager Celery without starting external services:

```bash
# 1. Install Python dependencies
pip install -r apps/api/requirements.txt

# 2. Run database migrations
alembic upgrade head

# 3. Seed realistic printing business data
python scripts/seed.py

# 4. Start the FastAPI development server
uvicorn apps.api.app.main:app --reload --port 8000
```
- API Swagger Documentation: `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Docker Compose Setup (Production-Like)
To spin up the complete stack with PostgreSQL, Redis, MinIO, API, and Celery worker:

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and start containers
docker compose up -d

# 3. Run migrations and seed inside the API container
docker compose exec api alembic upgrade head
docker compose exec api python scripts/seed.py
```

### Docker Service Ports
- **FastAPI Backend**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`
- **Redis Cache & Broker**: `localhost:6379`
- **MinIO S3 Storage**: `http://localhost:9000`
- **MinIO Web Console**: `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`)

---

## TypeScript Packages & Contract Generation
Whenever backend API schemas change, re-export OpenAPI and build contracts:

```bash
# Export OpenAPI specification
python scripts/generate_contracts.py

# Build shared TypeScript packages
npx -y typescript --project packages/api-types/tsconfig.json
npx -y typescript --project packages/api-client/tsconfig.json
npx -y typescript --project packages/validation/tsconfig.json
```

---

## Running Frontend Stubs

### Desktop Stub (Electron + React)
```bash
cd apps/desktop
npm install
npm start
```

### Mobile Stubs (React Native)
```bash
cd apps/worker-app
npm start
```
