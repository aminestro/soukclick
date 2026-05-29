# Upsells Strategy

## Timing

The upsell appears only after successful checkout submission. Do not show aggressive discounts before the customer submits their COD order.

## Duration

Show for 10-15 seconds.

The popup should have:

- Accept button.
- Skip button.
- Countdown indicator.
- Clear statement that it will be added to the same order.

## Price

Upsell product price:

99 MAD

This is the only place where aggressive discounting is allowed.

## Copy

Title:

عرض خاص قبل ما نرسلو الطلب

Body:

قدري تزيدي هاد المنتوج مع نفس الطلب غير بـ 99 درهم. نفس التوصيل ونفس الأداء عند الاستلام.

CTA:

زيديه لطلبي

Skip:

لا شكرا، كملي الطلب

## Matching Logic

Upsells should be relevant:

- Vegetable chopper -> kitchen storage or washing machine organizer if household bundle.
- Shoe rack -> coat rack.
- Coat rack -> shoe rack.
- Washing machine organizer -> coat rack or cleaning organization accessory.

## Backend Behavior

The original order is already created before upsell.

If accepted:

- Add upsell item to order.
- Recalculate total.
- Send order update to Google Sheets if possible.
- Track `UpsellAccepted`.

If skipped:

- Track `UpsellSkipped`.
- Continue to thank-you page.

