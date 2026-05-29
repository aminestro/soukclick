# Backend Structure

## Goal

The backend handles product data, COD orders, fraud prevention, tracking APIs, Google Sheets webhook delivery, and future admin scalability.

## Recommended Folder Structure

```text
backend/
  alembic/
    versions/
  app/
    api/
      v1/
        routes/
          products.py
          collections.py
          orders.py
          upsells.py
          tracking.py
          health.py
    core/
      config.py
      database.py
      security.py
      logging.py
    models/
      product.py
      order.py
      review.py
      fraud.py
      tracking.py
    schemas/
      product.py
      order.py
      tracking.py
    services/
      fraud_service.py
      google_sheets_service.py
      maxmind_service.py
      meta_capi_service.py
      tiktok_events_service.py
      phone_service.py
      pricing_service.py
    repositories/
      product_repository.py
      order_repository.py
    main.py
  tests/
  Dockerfile
  alembic.ini
  pyproject.toml
```

## API Versioning

Use `/api/v1`.

Core endpoints:

- `GET /api/v1/health`
- `GET /api/v1/products`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/collections/{slug}`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/{order_id}/upsell`
- `POST /api/v1/tracking/events`

## Backend Responsibilities

- Validate checkout payloads.
- Normalize Moroccan phone numbers.
- Calculate totals server-side.
- Create orders and order items.
- Run fraud checks.
- Send Google Sheets webhook.
- Send server-side conversion events.
- Expose product data.
- Protect against duplicate fake orders.

## Error Handling

Return clean API errors:

- `400` validation error.
- `403` blocked fraud or non-Morocco IP.
- `409` duplicate order risk when appropriate.
- `429` suspicious velocity.
- `500` internal error with safe public message.

## Logging

Log:

- Order creation attempts.
- Fraud check results.
- Webhook failures.
- Tracking API failures.

Never log full secrets or sensitive personal data unnecessarily.

