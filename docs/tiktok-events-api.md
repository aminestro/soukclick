# TikTok Pixel And Events API

## Frontend Env

```env
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
```

## Backend Env

```env
TIKTOK_EVENTS_API_ENABLED=false
TIKTOK_PIXEL_CODE=
TIKTOK_ACCESS_TOKEN=
```

## Browser Events

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `SubmitForm` mapped from `Lead`
- `CompletePayment` mapped from `CODOrderPlaced`

For COD campaigns, decide in TikTok Ads Manager whether to optimize for lead-style submit or complete-payment-style order placement.

## Server Events

When enabled, backend sends:

- `CompletePayment` for COD order creation.
- `CompletePayment` for accepted upsell.

## Deduplication

Use frontend-generated `event_id` for COD order placement and pass it to backend.

## Testing

1. Configure pixel code and access token.
2. Set `TIKTOK_EVENTS_API_ENABLED=true`.
3. Submit a test COD order.
4. Check TikTok Events Manager diagnostics.

