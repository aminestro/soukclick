# Tracking Setup

## Goal

Souk Click tracks Moroccan COD ecommerce events for Meta, TikTok, and Snapchat without slowing down page rendering or breaking checkout.

MaxMind is not part of this phase.

## Frontend Environment Variables

```env
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_SNAP_PIXEL_ID=
```

If a pixel ID is missing, that pixel silently does not load.

## Backend Environment Variables

```env
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

## Events Implemented

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `Lead`
- `CODOrderPlaced`
- `UpsellShown`
- `UpsellAccepted`
- `UpsellSkipped`
- `ThankYouViewed`

## COD Event Strategy

- Use `Lead` when the checkout form is submitted.
- Use `CODOrderPlaced` after the backend successfully creates the order.
- Browser `CODOrderPlaced` maps to purchase-style platform events.
- Backend CAPI sends purchase-style server events only when enabled.

## Deduplication

For COD order placement:

1. Frontend generates one `event_id`.
2. Frontend sends that `event_id` with `POST /api/v1/orders`.
3. Backend stores it on the order.
4. Backend CAPI uses the same `event_id`.
5. Frontend fires the browser `CODOrderPlaced` event with the same `event_id`.

## Metadata

Frontend captures and stores:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- `ttclid`
- `sc_click_id`

Checkout sends these values with the order. Backend includes them in webhook and CAPI payloads where useful.

## Performance Rules

- Pixels load after idle or short timeout.
- Pixel failures are silent.
- Missing IDs do not break rendering.
- Server CAPI failures are logged and do not undo order creation.

## Testing

1. Add test pixel IDs to frontend env.
2. Visit a product page with UTM params.
3. Add product to cart.
4. Open checkout.
5. Submit a test COD order.
6. Verify browser events in platform helpers.
7. Enable backend CAPI test mode and confirm server events.

