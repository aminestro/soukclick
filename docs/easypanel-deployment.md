# EasyPanel Deployment

This guide deploys Souk Click as three core services: PostgreSQL, backend API, and Next.js frontend. Redis is optional for future rate limiting.

## 1. Create PostgreSQL

Create a Postgres service in EasyPanel.

Recommended values:

```text
Service name: soukclick_database
Database: soukclick
User: soukclick
Password: generate a strong password
Internal host: use the hostname EasyPanel gives the service
Port: 5432
```

Do not expose the database publicly. Enable backups before launch.

Backend `DATABASE_URL` format:

```env
DATABASE_URL=postgresql+psycopg://soukclick:YOUR_PASSWORD@soukclick_database:5432/soukclick
```

## 2. Deploy Backend

Create an app from the `backend/` directory.

Build type: Dockerfile.

Port: `8000`.

Domain: `api.soukclick.ma`.

Health check path:

```text
/api/v1/health
```

Required backend env:

```env
APP_ENV=production
APP_NAME=Souk Click API
API_URL=https://api.soukclick.ma
FRONTEND_URL=https://soukclick.ma
DATABASE_URL=postgresql+psycopg://soukclick:YOUR_PASSWORD@soukclick_database:5432/soukclick
REDIS_URL=
ORDER_WEBHOOK_ENABLED=false
ORDER_WEBHOOK_URL=
MAXMIND_ENABLED=false
MAXMIND_ACCOUNT_ID=
MAXMIND_LICENSE_KEY=
MAXMIND_MINFRAUD_ENABLED=false
MAXMIND_GEOIP_ENABLED=false
FRAUD_BLOCK_HIGH_RISK=false
FRAUD_TEST_PHONE=055000000
ALLOWED_COUNTRY_CODE=MA
META_CAPI_ENABLED=false
META_PIXEL_ID=
META_ACCESS_TOKEN=
META_TEST_EVENT_CODE=
TIKTOK_EVENTS_API_ENABLED=false
TIKTOK_PIXEL_CODE=
TIKTOK_ACCESS_TOKEN=
SNAP_CAPI_ENABLED=false
SNAP_PIXEL_ID=
SNAP_ACCESS_TOKEN=
```

The backend Dockerfile runs migrations automatically before Uvicorn:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

If EasyPanel uses a separate release command, run:

```bash
alembic upgrade head
```

Then start:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 3. Deploy Frontend

Create an app from the `frontend/` directory.

Build type: Dockerfile.

Port: `3000`.

Domain: `soukclick.ma`.

Set these as build-time variables and runtime variables:

```env
NEXT_PUBLIC_SITE_URL=https://soukclick.ma
NEXT_PUBLIC_API_URL=https://api.soukclick.ma
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_SNAP_PIXEL_ID=
```

Important: `NEXT_PUBLIC_*` values are baked into the Next.js build. Rebuild the frontend after changing the API URL or pixel IDs.

## 4. CORS

Backend `FRONTEND_URL` must match the frontend origin exactly:

```env
FRONTEND_URL=https://soukclick.ma
```

If testing with a temporary EasyPanel preview domain, temporarily set `FRONTEND_URL` to that preview origin or add multi-origin CORS support before launch.

## 5. Google Sheets Webhook

Deploy the Apps Script from `docs/examples/google-sheets-webhook.js`.

Then set:

```env
ORDER_WEBHOOK_ENABLED=true
ORDER_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Submit a test order with phone `055000000` and confirm a row appears in the sheet.

## 6. Pixels And CAPI

Start with browser pixels only:

```env
NEXT_PUBLIC_META_PIXEL_ID=...
NEXT_PUBLIC_TIKTOK_PIXEL_ID=...
NEXT_PUBLIC_SNAP_PIXEL_ID=...
META_CAPI_ENABLED=false
TIKTOK_EVENTS_API_ENABLED=false
SNAP_CAPI_ENABLED=false
```

After browser events appear correctly, enable server events one platform at a time. Keep the same pixel IDs on frontend and backend for deduplication.

## 7. MaxMind

Initial launch can run with MaxMind disabled:

```env
MAXMIND_ENABLED=false
FRAUD_BLOCK_HIGH_RISK=false
```

When ready:

```env
MAXMIND_ENABLED=true
MAXMIND_ACCOUNT_ID=...
MAXMIND_LICENSE_KEY=...
MAXMIND_GEOIP_ENABLED=true
MAXMIND_MINFRAUD_ENABLED=true
FRAUD_BLOCK_HIGH_RISK=false
```

Let the system mark risky orders as `review` before enabling blocking.

## 8. Production Test Order

Use test phone:

```text
055000000
```

Checklist:

- Product page opens.
- Product adds to cart.
- Cart opens.
- Checkout modal validates fields.
- Order succeeds.
- Upsell appears.
- Thank-you page loads.
- Backend order can be fetched by order code.
- Google Sheet receives the row if webhook is enabled.
- Fraud status is `whitelisted` for the test phone.

## 9. Domains

Point DNS:

```text
soukclick.ma -> frontend service
api.soukclick.ma -> backend service
```

Enable HTTPS for both domains before running ad traffic.

## 10. Rollback

Keep the previous frontend and backend image available in EasyPanel.

If checkout breaks, disable CAPI/MaxMind/webhook first, then redeploy the last known good image.
