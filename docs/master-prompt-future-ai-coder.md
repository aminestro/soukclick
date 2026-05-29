# Master Prompt For Future AI Coder

Use this prompt when handing the project to another AI coder after the docs are approved.

```text
You are building Souk Click, a premium Moroccan DTC ecommerce store focused on smart home gadgets, organization products, practical daily solutions, and useful household products.

Important: this is not a cheap dropshipping store. It must feel like a real Moroccan brand with strong trust, premium UX, high COD confirmation rate, high AOV, and conversion optimization for TikTok/Facebook traffic in Morocco.

Before coding, read the entire docs folder. Treat docs as the source of truth:

- docs/README.md
- docs/architecture.md
- docs/frontend-structure.md
- docs/backend-structure.md
- docs/database-schema.md
- docs/brand-positioning.md
- docs/moroccan-icp-psychology.md
- docs/darija-copywriting-style.md
- docs/cro-strategy.md
- docs/product-page-structure.md
- docs/cart-drawer-flow.md
- docs/checkout-flow.md
- docs/offers-strategy.md
- docs/upsells-strategy.md
- docs/cod-optimization.md
- docs/fake-order-prevention.md
- docs/mobile-ux-rules.md
- docs/design-system.md
- docs/colors-typography.md
- docs/pixel-tracking.md
- docs/event-naming.md
- docs/capi-setup.md
- docs/seo-structure.md
- docs/product-adding-guide.md
- docs/deployment-guide.md
- docs/env-variables-guide.md
- docs/docker-guide.md
- docs/easypanel-deployment.md
- docs/analytics-setup.md
- docs/performance-optimization.md
- docs/security-rules.md
- docs/coding-rules.md
- docs/reusable-component-rules.md
- docs/scaling-guide-future-products.md
- docs/google-sheets-webhook.md

Project requirements:

Create:
- frontend/
- backend/
- docs/ must remain intact and updated when implementation changes behavior.

Frontend stack:
- Next.js latest
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- Zustand
- TanStack Query
- Zod
- React Hook Form
- SwiperJS

Backend stack:
- Python FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Optional Redis
- Dockerized backend

Infrastructure:
- Docker
- Docker Compose
- GitHub ready
- EasyPanel deployment ready

Domains:
- Frontend: soukclick.ma
- Backend: api.soukclick.ma

Database:
- Name: soukclick
- Example internal connection:
postgresql+psycopg://soukclick:soukclick@soukclick_database:5432/soukclick

Brand:
- Name: Souk Click
- Subtitle: سوق كليك
- Logo: S or SC inside a red circle, logo group placed on the right side of the header.
- Feel: clean, premium, practical, trustworthy, Moroccan, modern.
- Avoid cheap dropshipping, AliExpress feeling, generic ecommerce, and scammy urgency.

Language:
- Website language mainly Moroccan Darija Arabic.
- Tone must be trustworthy, modern, emotional, practical, and conversion optimized.

Current products:
1. Multifunctional Vegetable Chopper
2. Five Layer Shoe Rack
3. Clothes Hanger Floor Indoor Coat Rack
4. 4 Tier Metal Washing Machine Organizer

Use placeholder/generated product images for now. The owner will replace them later with real images/videos.

Pricing:
- 1 piece: 199 MAD
- 2 pieces: 279 MAD
- 3 pieces: 349 MAD
- Use bundle psychology, scarcity, urgency, savings, best seller labels, "most chosen", and limited stock labels without making the brand feel fake or cheap.

Required pages:
- Home page
- Product pages
- Collection pages
- About us
- Contact
- FAQ
- Shipping policy
- Return policy
- Privacy policy
- Terms
- Thank-you page

Product system:
- Dynamic product pages
- Reusable product page template
- Reusable CRO sections
- Reusable reviews system
- Reusable bundles system
- Reusable FAQ sections
- Reusable trust sections
- Easy product adding workflow

Cart:
- Add-to-cart opens cart drawer automatically.
- Drawer includes order summary, trust badges, delivery reassurance, urgency, scarcity, cross-sells, recommended products, free shipping threshold, and progress bar psychology.

Checkout:
- COD only.
- Cart CTA opens checkout popup.
- Fields: full name, Moroccan phone number, city, address.
- Validate Moroccan phone numbers client-side and server-side.
- Normalize phone server-side.
- After successful checkout, show a 10-15 second upsell popup.
- Upsell product discounted to 99 MAD.
- Then redirect to thank-you page.

Order flow:
- Backend stores complete order data.
- Backend sends orders to Google Sheets webhook.
- Include docs/examples/google-sheets-webhook.js and docs/examples/order-template.csv as references.

Fake order protection:
- Use MaxMind API.
- Only allow Morocco IPs, non-suspicious IPs, non-VPN traffic.
- Add MaxMind env variables.
- Whitelist phone 055000000 for testing.
- Add duplicate phone detection and suspicious velocity checks.

Tracking:
- Meta Pixel
- TikTok Pixel
- Snapchat Pixel
- Meta CAPI
- TikTok Events API
- Deduplication with event_id
- Deferred loading for speed
- Proper event naming
- COD optimized event tracking
- Moroccan phone formatting and hashing for server events where needed.

Design:
- Colors: deep red, black, white, light gray.
- Premium spacing, readable typography, mobile-first, smooth animations.
- Use shadcn/ui and lucide icons.

SEO:
- Technical SEO
- Product schema
- OG tags
- Sitemap
- Robots
- Fast loading
- Image optimization

Implementation order:
1. Scaffold frontend and backend structure.
2. Add Docker, Docker Compose, env.example files.
3. Build backend models, schemas, migrations, order API, product API, fraud services, tracking services, and webhook service.
4. Seed the first products.
5. Build frontend layout, design system, product templates, cart drawer, checkout, upsell, thank-you page, policy pages.
6. Add SEO, schema, pixels, event tracking.
7. Verify mobile UX, checkout, order creation, Google Sheets payload, fraud test whitelist, and Docker startup.

Do not skip documentation updates. If behavior differs from the docs, update the relevant markdown file.
```
