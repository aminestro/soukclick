# Final Launch Checklist

Use this before sending real TikTok or Facebook traffic to Souk Click.

## Local Test Checklist

- Frontend dependencies install with `npm install`.
- Frontend lint passes with `npm run lint`.
- Frontend typecheck passes with `npm run typecheck`.
- Frontend production build passes with `npm run build`.
- Backend dependencies install with `pip install -r requirements.txt`.
- Python compile check passes.
- FastAPI imports without errors.
- Alembic has one current head.
- Offline migration SQL generates successfully.
- Health endpoint returns `{"status":"ok","service":"soukclick-api"}`.

## Production Test Checklist

- `soukclick.ma` loads over HTTPS.
- `api.soukclick.ma/api/v1/health` returns healthy JSON.
- Frontend calls the production API, not localhost.
- CORS allows only the production frontend origin.
- Product list loads.
- Product detail pages load by slug.
- Cart drawer opens on add to cart.
- Checkout modal opens from the cart CTA.
- Thank-you page loads with the order code.

## COD Test Order Checklist

- Use phone `055000000` for the first QA order.
- Submit full name, city, address, and Moroccan phone.
- Confirm backend calculates totals, not the frontend.
- Confirm order code format looks like `SC-2026-000001`.
- Confirm customer sees the team-call confirmation message.
- Confirm ops team can retrieve the order by code.

## Pixel Test Checklist

- Meta PageView fires.
- Meta ViewContent fires on product pages.
- Meta AddToCart fires from product CTA.
- Meta InitiateCheckout fires when checkout opens.
- Meta Purchase or CODOrderPlaced fires after backend order success.
- TikTok PageView, ViewContent, AddToCart, InitiateCheckout, and CompletePayment appear.
- Snapchat PAGE_VIEW, VIEW_CONTENT, ADD_CART, START_CHECKOUT, and PURCHASE appear.
- Event IDs are present for deduplication.
- Missing pixel IDs do not break the site.

## Webhook Test Checklist

- Google Apps Script is deployed as a web app.
- `ORDER_WEBHOOK_ENABLED=true`.
- `ORDER_WEBHOOK_URL` points to the Apps Script deployment URL.
- Test order appends one row.
- Row includes items, totals, UTM fields, IP/user agent, fraud placeholders, upsell status, and timestamps.
- Backend order `webhook_status` becomes `sent`.
- Manual resend endpoint works if a test webhook fails.

## Fraud Test Checklist

- Phone `055000000` bypasses checks and creates a whitelisted order.
- Duplicate recent phone is flagged.
- Missing user agent is flagged.
- Repeated IP velocity is flagged.
- Non-Morocco IP is marked for review when MaxMind data exists.
- High risk orders are marked `review` while `FRAUD_BLOCK_HIGH_RISK=false`.
- Blocked orders show only the friendly Darija message.

## Mobile UX Checklist

- Header stays usable on small screens.
- Product gallery does not overflow.
- Offer cards are easy to tap.
- Sticky mobile CTA does not cover critical text.
- Cart drawer fits on mobile.
- Checkout modal scrolls correctly.
- Validation errors are readable.
- Thank-you summary fits without horizontal scrolling.

## Launch Decision

Launch only after one complete production order succeeds from ad click to thank-you page, and the same order appears in the backend plus Google Sheet.
