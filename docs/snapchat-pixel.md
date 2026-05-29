# Snapchat Pixel And CAPI Placeholder

## Frontend Env

```env
NEXT_PUBLIC_SNAP_PIXEL_ID=
```

## Backend Env

```env
SNAP_CAPI_ENABLED=false
SNAP_PIXEL_ID=
SNAP_ACCESS_TOKEN=
```

## Browser Events

- `PAGE_VIEW`
- `VIEW_CONTENT`
- `ADD_CART`
- `START_CHECKOUT`
- `PURCHASE` mapped from `CODOrderPlaced`

## Backend Status

Backend has a Snapchat CAPI placeholder service behind env flags. It does not send real Snapchat CAPI requests yet. This keeps the architecture ready without hardcoding an incomplete API implementation.

## Testing

1. Add `NEXT_PUBLIC_SNAP_PIXEL_ID`.
2. Confirm browser pixel events with Snapchat debugging tools.
3. Keep `SNAP_CAPI_ENABLED=false` until the exact Snapchat CAPI app setup is ready.

