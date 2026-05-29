# Frontend Structure

## Goal

The frontend should be a mobile-first, high-converting Moroccan ecommerce storefront with reusable product and CRO components.

## Recommended Folder Structure

```text
frontend/
  app/
    (store)/
      page.tsx
      products/[slug]/page.tsx
      collections/[slug]/page.tsx
      about/page.tsx
      contact/page.tsx
      faq/page.tsx
      shipping-policy/page.tsx
      return-policy/page.tsx
      privacy-policy/page.tsx
      terms/page.tsx
      thank-you/page.tsx
    api/
    layout.tsx
    sitemap.ts
    robots.ts
  components/
    brand/
    cart/
    checkout/
    cro/
    layout/
    product/
    tracking/
    ui/
  config/
    site.ts
    offers.ts
    tracking.ts
  data/
    seed-products.ts
  hooks/
  lib/
    api-client.ts
    phone.ts
    seo.ts
    tracking.ts
    utils.ts
    validators.ts
  stores/
    cart-store.ts
    checkout-store.ts
  styles/
  types/
```

## App Router Pages

Required pages:

- Home.
- Product pages.
- Collection pages.
- About us.
- Contact.
- FAQ.
- Shipping policy.
- Return policy.
- Privacy policy.
- Terms.
- Thank-you.

## State

Use Zustand for:

- Cart items.
- Selected offers.
- Cart drawer open/close.
- Checkout modal open/close.
- Upsell modal state.

Use TanStack Query for:

- Product data.
- Collection data.
- Product recommendations.
- Order submission mutations.
- Upsell updates.

## Forms

Use React Hook Form and Zod for:

- Checkout form.
- Contact form.
- Newsletter or lead forms if added later.

Client validation mirrors backend validation but backend remains authoritative.

## SEO

Each product page must generate:

- Metadata title.
- Description.
- OG image.
- Product schema.
- Canonical URL.

## RTL

Use `dir="rtl"` for Arabic/Darija primary content. Keep Latin product IDs and technical strings readable.

