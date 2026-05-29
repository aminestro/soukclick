# Offers Strategy

## Default Pricing

- 1 piece: 199 MAD.
- 2 pieces: 279 MAD.
- 3 pieces: 349 MAD.

## Offer Psychology

The default selected offer should usually be 2 pieces because it improves AOV while feeling realistic and useful for Moroccan households.

Recommended labels:

- 1 piece: تجربة وحدة
- 2 pieces: الأكثر اختيارا
- 3 pieces: وفري أكثر

## Visual Treatment

- Show offers as selectable cards or radio rows.
- Make the selected offer visually clear with a deep red border.
- Use small savings copy, not noisy discount math.
- Add "الأكثر اختيارا" pill on the 2-piece offer.
- Add "أفضل قيمة" or "وفري أكثر" on the 3-piece offer.

## Example Offer Copy

### 1 Piece

قطعة وحدة  
199 درهم  
مناسبة إلا بغيتي تجربي المنتوج.

### 2 Pieces

جوج قطع  
279 درهم  
الأكثر اختيارا للعائلات والدار.

### 3 Pieces

ثلاث قطع  
349 درهم  
أحسن قيمة وكتوفري أكثر.

## Scarcity Rules

Use product-level inventory indicators:

- Low stock when stock is below configured threshold.
- "دفعة جديدة وصلات" when restocked.
- Avoid permanent false urgency.

## Bundle Data Model

Each product should support:

- `offer_1_price`
- `offer_2_price`
- `offer_3_price`
- `default_offer`
- `best_seller_offer`
- `savings_text`
- `stock_status`

