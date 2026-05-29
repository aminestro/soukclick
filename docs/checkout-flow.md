# Checkout Flow

## Checkout Type

Cash on delivery only.

Checkout should open as a popup from the cart drawer. It must feel fast, official, and low-risk.

## Fields

Required fields:

- Full name.
- Moroccan phone number.
- City.
- Address.

Do not ask for email by default. Do not ask for card details.

## Moroccan Phone Validation

Accept valid Moroccan mobile numbers:

- `06XXXXXXXX`
- `07XXXXXXXX`
- `+2126XXXXXXXX`
- `+2127XXXXXXXX`
- `2126XXXXXXXX`
- `2127XXXXXXXX`

Normalize server-side to E.164:

- `+2126XXXXXXXX`
- `+2127XXXXXXXX`

Test whitelist number:

- `055000000`

This number bypasses fake order protections for testing.

## Checkout Copy

Header:

كملي الطلب ديالك

Trust text:

الأداء حتى توصلك السلعة، وغادي نتاصلو بيك نأكدو الطلب قبل الإرسال.

CTA:

أكد الطلب

## After Submit

1. Validate fields client-side.
2. Submit order to backend.
3. Backend validates phone and anti-fraud checks.
4. Backend creates order.
5. Backend sends Google Sheets webhook.
6. Backend triggers server-side tracking events.
7. Frontend shows upsell popup for 10-15 seconds.
8. User accepts or skips upsell.
9. Frontend redirects to thank-you page.

## Thank-You Page

Must show:

- Order received message.
- Order summary.
- Phone number used.
- Total.
- "غادي نتاصلو بيك نأكدو الطلب".
- Recommended next action: keep phone available.

