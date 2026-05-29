# Google Sheets Setup

## Goal

Send every valid Souk Click COD order to Google Sheets so the confirmation team can call customers, manage order status, and export data later.

Pixels and MaxMind are not part of this step.

## 1. Create The Sheet

1. Open Google Sheets.
2. Create a new spreadsheet named `Souk Click Orders`.
3. Rename the first tab to `Orders`.
4. Copy the columns from `docs/examples/order-template.csv` into row 1, or let the Apps Script create headers automatically on first webhook call.

## 2. Columns

Required columns:

- `order_id`
- `internal_id`
- `created_at`
- `updated_at`
- `customer_name`
- `phone_raw`
- `phone_normalized`
- `city`
- `address`
- `products`
- `quantities`
- `offer_selected`
- `upsell_status`
- `upsell_items`
- `items_json`
- `subtotal`
- `delivery_fee`
- `discount_total`
- `total`
- `currency`
- `payment_method`
- `order_status`
- `confirmation_status`
- `webhook_status`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- `ttclid`
- `sc_click_id`
- `ip_address`
- `ip_country`
- `is_vpn`
- `is_proxy`
- `is_hosting`
- `user_agent`
- `fraud_status`
- `fraud_score`
- `fraud_flags`
- `fraud_reason`
- `notes`

## 3. Add Apps Script

1. In Google Sheets, go to `Extensions`.
2. Click `Apps Script`.
3. Delete the default code.
4. Paste the full contents of `docs/examples/google-sheets-webhook.js`.
5. Save the project as `Souk Click Order Webhook`.

## 4. Deploy Web App

1. Click `Deploy`.
2. Click `New deployment`.
3. Select `Web app`.
4. Set `Execute as` to `Me`.
5. Set `Who has access` to `Anyone`.
6. Click `Deploy`.
7. Copy the Web App URL.

## 5. Backend Environment

Set these values in `backend/.env` or your EasyPanel backend service:

```env
ORDER_WEBHOOK_ENABLED=true
ORDER_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Keep `ORDER_WEBHOOK_ENABLED=false` in local development if you do not want test orders going to Sheets.

## 6. Test Locally

Start backend and frontend, then submit a test order with the whitelisted phone:

```text
055000000
```

Or test the backend directly:

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Fatima Zahra\",\"phone\":\"055000000\",\"city\":\"Casablanca\",\"address\":\"Maarif, Rue Example\",\"items\":[{\"slug\":\"multifunctional-vegetable-chopper\",\"offer_quantity\":2}],\"utm_source\":\"tiktok\",\"utm_medium\":\"cpc\",\"utm_campaign\":\"test_campaign\"}"
```

Check the `Orders` tab. A new row should appear.

## 7. Manual Resend

If webhook delivery fails or was disabled when the order was created, resend later:

```bash
curl -X POST http://localhost:8000/api/v1/orders/SC-2026-000001/resend-webhook
```

The backend stores webhook status:

- `pending`: webhook disabled or not yet sent.
- `sent`: webhook accepted by Apps Script.
- `failed`: webhook attempt failed.

## Notes

- Webhook failure must never block order creation.
- The backend logs failures with the order code.
- The full structured item list is stored in `items_json`.
- Campaign and click IDs are captured by the frontend and sent with the order.
