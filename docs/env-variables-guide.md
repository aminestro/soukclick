# Environment Variables Guide

Souk Click uses separate frontend and backend env files. Never commit real secrets; copy `.env.example` to `.env` locally or add the variables directly in EasyPanel.

## Frontend

These values are public and are baked into the Next.js build. In Docker or EasyPanel, set them before building the frontend image.

```env
NEXT_PUBLIC_SITE_URL=https://soukclick.ma
NEXT_PUBLIC_API_URL=https://api.soukclick.ma
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_SNAP_PIXEL_ID=
```

`NEXT_PUBLIC_SITE_URL` is used for SEO, canonical URLs, sitemap, and share metadata.

`NEXT_PUBLIC_API_URL` must point to the public backend URL in production. For local Docker Compose, use `http://localhost:8000`.

Pixel IDs are optional. Missing IDs fail silently and keep the site fast.

## Backend

```env
APP_ENV=production
APP_NAME=Souk Click API
API_URL=https://api.soukclick.ma
FRONTEND_URL=https://soukclick.ma
DATABASE_URL=postgresql+psycopg://soukclick:soukclick@soukclick_database:5432/soukclick
REDIS_URL=redis://soukclick_redis:6379/0
```

`FRONTEND_URL` is used by CORS. It must exactly match the live frontend origin.

`DATABASE_URL` must use SQLAlchemy format. For this project, prefer `postgresql+psycopg://...`.

`REDIS_URL` is optional for now, but keep it ready for rate limits and stronger velocity checks.

## Google Sheets Webhook

```env
ORDER_WEBHOOK_ENABLED=false
ORDER_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_URL=
```

Use `ORDER_WEBHOOK_ENABLED=true` and `ORDER_WEBHOOK_URL=https://script.google.com/.../exec` when the Google Apps Script is deployed.

`GOOGLE_SHEETS_WEBHOOK_URL` is a legacy placeholder service variable. New order delivery uses `ORDER_WEBHOOK_URL`.

## Fraud And MaxMind

```env
MAXMIND_ENABLED=false
MAXMIND_ACCOUNT_ID=
MAXMIND_LICENSE_KEY=
MAXMIND_MINFRAUD_ENABLED=false
MAXMIND_GEOIP_ENABLED=false
FRAUD_BLOCK_HIGH_RISK=false
FRAUD_TEST_PHONE=055000000
ALLOWED_COUNTRY_CODE=MA
```

Keep `FRAUD_BLOCK_HIGH_RISK=false` during first production tests so suspicious orders are marked for review instead of blocked.

The test phone `055000000` bypasses fraud checks and should always work for QA.

## Meta CAPI

```env
META_CAPI_ENABLED=false
META_PIXEL_ID=
META_ACCESS_TOKEN=
META_TEST_EVENT_CODE=
```

Enable only after the browser pixel is verified in Events Manager.

## TikTok Events API

```env
TIKTOK_EVENTS_API_ENABLED=false
TIKTOK_PIXEL_CODE=
TIKTOK_ACCESS_TOKEN=
```

Use the same pixel code as the TikTok browser pixel for deduplication.

## Snapchat

```env
SNAP_CAPI_ENABLED=false
SNAP_PIXEL_ID=
SNAP_ACCESS_TOKEN=
```

Browser Snap Pixel is implemented. Server-side Snapchat CAPI is intentionally a guarded placeholder until the ad account setup is final.

## Local Development

Frontend local:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend local:

```env
APP_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql+psycopg://soukclick:soukclick@localhost:5432/soukclick
ORDER_WEBHOOK_ENABLED=false
MAXMIND_ENABLED=false
META_CAPI_ENABLED=false
TIKTOK_EVENTS_API_ENABLED=false
SNAP_CAPI_ENABLED=false
```

## Production Safety

Rotate all ad platform and MaxMind tokens if exposed.

Do not expose PostgreSQL publicly.

Keep production webhook URLs secret.

After changing any `NEXT_PUBLIC_*` variable, rebuild and redeploy the frontend.
