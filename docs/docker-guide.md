# Docker Guide

## Required Containers

- `soukclick_frontend`
- `soukclick_backend`
- `soukclick_database`
- Optional `soukclick_redis`

## Compose Requirements

Docker Compose should:

- Build frontend from `frontend/Dockerfile`.
- Build backend from `backend/Dockerfile`.
- Start PostgreSQL with database `soukclick`.
- Pass environment variables to both apps.
- Run backend migrations on startup or through a migration command.

## Backend Startup

Backend container should:

1. Wait for database.
2. Run Alembic migrations.
3. Start FastAPI server.

## Database

PostgreSQL credentials for local/dev:

- User: `soukclick`
- Password: `soukclick`
- Database: `soukclick`
- Host: `soukclick_database`
- Port: `5432`

Internal URL:

`postgresql+psycopg://soukclick:soukclick@soukclick_database:5432/soukclick`

## Volumes

Use a named volume for PostgreSQL data:

- `soukclick_postgres_data`

## Local Commands

The final project should support:

- Start all services.
- Stop all services.
- Run backend migrations.
- View logs.
- Seed sample products.
