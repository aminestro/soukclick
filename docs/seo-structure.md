# SEO Structure

## SEO Goals

- Search visibility for Moroccan household products.
- Strong social previews for ad sharing.
- Technical SEO readiness.
- Product schema for rich search results.

## Required Files

Frontend must implement:

- `sitemap.ts`
- `robots.ts`
- Dynamic metadata per page.
- Product schema JSON-LD.
- OG tags.
- Twitter/X card tags.

## URL Structure

- `/`
- `/products/{slug}`
- `/collections/{slug}`
- `/about`
- `/contact`
- `/faq`
- `/shipping-policy`
- `/return-policy`
- `/privacy-policy`
- `/terms`
- `/thank-you`

## Product Metadata

Each product page needs:

- SEO title.
- SEO description.
- Canonical URL.
- OG image.
- Product structured data.

## Product Schema

Include:

- `@type: Product`
- `name`
- `description`
- `image`
- `brand: Souk Click`
- `offers`
- `priceCurrency: MAD`
- `availability`
- `aggregateRating` when reviews exist.

## Performance SEO

- Optimize images.
- Lazy load below-fold images.
- Keep JavaScript bundle controlled.
- Avoid blocking tracking scripts.
- Use semantic headings.

