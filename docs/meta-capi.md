# Meta Pixel And CAPI

## Frontend Env

```env
NEXT_PUBLIC_META_PIXEL_ID=
```

## Backend Env

```env
META_CAPI_ENABLED=false
META_PIXEL_ID=
META_ACCESS_TOKEN=
META_TEST_EVENT_CODE=
```

## Browser Events

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `Lead`
- `Purchase` mapped from `CODOrderPlaced`

## Server Events

When enabled, backend sends:

- `Purchase` for COD order creation.
- `Purchase` for accepted upsell, with upsell value.

## Deduplication

Use the same `event_id` for browser `CODOrderPlaced` and backend `Purchase`.

## User Data

Backend hashes:

- Moroccan phone number.

Future placeholder:

- Email hash if email is added later.

## Testing

1. Put `META_TEST_EVENT_CODE` from Meta Events Manager.
2. Set `META_CAPI_ENABLED=true`.
3. Submit an order with test phone `055000000`.
4. Check Events Manager test events.

