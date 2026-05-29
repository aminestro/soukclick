# Reusable Component Rules

## Goal

Build components that allow Souk Click to scale from 4 products to many products without rebuilding product pages.

## Component Categories

### Layout

- Header.
- Footer.
- Mobile menu.
- Section wrapper.
- Trust strip.

### Product

- Product gallery.
- Product hero.
- Offer selector.
- Product benefits.
- Product reviews.
- Product FAQ.
- Product schema component.
- Related products grid.

### Cart And Checkout

- Cart drawer.
- Cart line item.
- Free shipping progress.
- Cross-sell row.
- Checkout modal.
- Upsell modal.
- Thank-you summary.

### CRO Blocks

- Problem solution block.
- Before after block.
- UGC gallery.
- Testimonial carousel.
- Guarantee block.
- COD reassurance block.
- Final CTA.

## Component Rules

- Components should receive structured data props.
- Avoid hardcoding one product into reusable components.
- Keep copy in product data where possible.
- Keep layout behavior in components.
- Keep pricing calculation server-authoritative.
- Make components mobile-first.

## Naming

Use clear component names:

- `ProductHero`
- `OfferSelector`
- `CartDrawer`
- `CheckoutModal`
- `UpsellModal`
- `TrustStrip`
- `ProblemSolutionSection`
- `FrequentlyBoughtTogether`

## Avoid

- One-off product page components unless truly product-specific.
- Layout duplication across pages.
- Copy hidden inside deeply nested UI components.
- Business logic in visual components.

