# Performance Optimization

## Goals

- Fast product pages on mobile.
- Fast checkout interaction.
- Tracking scripts should not block rendering.
- Images should be optimized and lazy loaded.

## Frontend Rules

- Use Next.js image optimization.
- Lazy load below-fold media.
- Keep first product image optimized.
- Defer pixels.
- Split client components.
- Avoid unnecessary global providers.
- Avoid heavy animation in first viewport.

## Product Gallery

- First image/video should load quickly.
- Use responsive image sizes.
- Use poster images for videos.
- Avoid auto-playing many videos at once.

## Backend Rules

- Keep order creation fast.
- Do not block user flow on slow external services.
- Use timeouts for Google Sheets and CAPI calls.
- Store events and retry when needed.

## Monitoring

Track:

- Frontend load time.
- API response time.
- Checkout submission time.
- Webhook failures.
- Tracking API failures.

