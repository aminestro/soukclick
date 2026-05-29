# Google Sheets Webhook

## Goal

Every order must be sent to a Google Sheets webhook so the confirmation and fulfillment process can start immediately.

## Webhook File

Use:

- Backend service: `backend/app/modules/webhooks/services/order_webhook_service.py`
- Apps Script example: `docs/examples/google-sheets-webhook.js`
- Setup guide: `docs/google-sheets-setup.md`

## Sheet Columns

Recommended columns:

- `order_id`
- `created_at`
- `customer_name`
- `phone_raw`
- `phone_normalized`
- `city`
- `address`
- `products`
- `quantities`
- `offer_selected`
- `upsell_status`
- `subtotal`
- `delivery_fee`
- `total`
- `currency`
- `payment_method`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbp`
- `fbc`
- `ttp`
- `snap_click_id`
- `ip_address`
- `fraud_status`
- `fraud_reason`
- `confirmation_status`
- `notes`

## CSV Example

Use `docs/examples/order-template.csv` as the current column template.

## Webhook Reliability

- Store the order before sending webhook.
- Keep order creation successful even if the webhook fails.
- Store webhook status on the order: `pending`, `sent`, or `failed`.
- Log failures with the order code.
- Allow manual resend with `POST /api/v1/orders/{order_code}/resend-webhook`.
