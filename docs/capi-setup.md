# CAPI Setup

## Meta CAPI

Required environment variables:

- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `META_TEST_EVENT_CODE`
- `META_CAPI_ENABLED`

Send server events for:

- `ViewContent` if backend receives event.
- `AddToCart` if backend event endpoint is used.
- `InitiateCheckout`.
- `Purchase`.

## TikTok Events API

Required environment variables:

- `TIKTOK_PIXEL_CODE`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_EVENTS_API_ENABLED`

Send server events for:

- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `CompletePayment` or lead equivalent.

## Deduplication

Frontend generates event ID:

```text
event_name + timestamp + random uuid
```

Backend stores and forwards same event ID.

## Hashing

Hash PII with SHA-256 after normalization and trimming.

Phone:

1. Normalize to E.164.
2. Lowercase not needed for phone.
3. SHA-256 hash.

Name:

1. Trim.
2. Lowercase.
3. SHA-256 hash.

## COD Purchase Value

Use total order value in MAD:

- Include accepted upsell if updated.
- Exclude pending upsell before accepted.
- Delivery fee included only if charged.

## Failure Handling

- Do not fail checkout if CAPI fails.
- Store failed tracking event.
- Retry later when possible.
- Log safe error details.
