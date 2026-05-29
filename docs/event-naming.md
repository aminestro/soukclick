# Event Naming

## Principles

- Use platform-standard names for ad platforms.
- Use internal names for analytics clarity.
- Keep names stable.
- Include event IDs for deduplication.

## Platform Events

### Meta

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `Lead`
- `Purchase`

### TikTok

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `CompletePayment`

For COD, map successful order submission to `CompletePayment` only if the ad account strategy treats COD submissions as purchase conversions. Otherwise track as lead and optimize accordingly.

### Snapchat

- `PAGE_VIEW`
- `VIEW_CONTENT`
- `ADD_CART`
- `START_CHECKOUT`
- `PURCHASE`

## Internal Events

- `ProductViewed`
- `OfferSelected`
- `CartOpened`
- `CartCrossSellAdded`
- `CheckoutOpened`
- `OrderSubmitted`
- `UpsellShown`
- `UpsellAccepted`
- `UpsellSkipped`
- `ThankYouViewed`
- `FraudBlocked`

## Event Payload Basics

Every ecommerce event should include:

- `event_id`
- `event_name`
- `product_id`
- `product_slug`
- `product_name`
- `quantity`
- `value`
- `currency`
- `offer_label`
- `source_url`
- `utm_*`

