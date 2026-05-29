# Pixel Tracking

## Required Pixels

- Meta Pixel.
- TikTok Pixel.
- Snapchat Pixel.
- Meta CAPI.
- TikTok Events API.

## Loading Strategy

- Defer pixel loading where possible.
- Load after first interaction or after short idle delay when appropriate.
- Keep critical product page rendering fast.
- Store consent configuration if privacy flow is added later.

## Browser Events

Track:

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `Lead`
- `Purchase`
- `UpsellShown`
- `UpsellAccepted`
- `UpsellSkipped`

For COD, `Purchase` can represent successful order submission, but also send an internal `OrderSubmitted` event for analytics clarity.

## Deduplication

Generate a unique `event_id` for each important event:

- Browser event includes `event_id`.
- Server event includes the same `event_id`.
- Store event IDs in backend tracking table.

## User Data

For server-side events, hash where required:

- Phone.
- Name if sent.
- City when supported.

Normalize phone before hashing:

- `+2126XXXXXXXX`
- `+2127XXXXXXXX`

## UTM and Click IDs

Capture and persist:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- `ttclid`
- `sc_click_id` or Snapchat click ID if available.
- `_fbp`
- `_fbc`
- `_ttp`

Persist through cart, checkout, backend order, and Google Sheets.

