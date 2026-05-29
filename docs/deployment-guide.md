# Deployment Guide

## Domains

- Frontend: `soukclick.ma`
- Backend: `api.soukclick.ma`

## Required Services

- Frontend container.
- Backend container.
- PostgreSQL container or managed database.
- Optional Redis container.

## Deployment Steps

1. Configure environment variables.
2. Build backend image.
3. Run database migrations.
4. Start backend.
5. Build frontend image.
6. Start frontend.
7. Configure domains and HTTPS.
8. Test checkout.
9. Test Google Sheets webhook.
10. Test tracking in platform debug tools.

## Health Checks

Backend:

- `GET /api/v1/health`

Frontend:

- Home page loads.
- Product page loads.

## Production Checklist

- HTTPS active.
- Environment variables set.
- Database reachable.
- Migrations applied.
- MaxMind configured.
- Google Sheets webhook configured.
- Pixel IDs configured.
- CAPI tokens configured.
- Test order with `055000000` works.
- Real phone validation works.

