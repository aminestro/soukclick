# Architecture

## System Overview

Souk Click uses a separated frontend and backend:

- `frontend/`: Next.js ecommerce storefront.
- `backend/`: FastAPI API, order engine, anti-fraud, tracking, Google Sheets webhook.
- `docs/`: product, CRO, deployment, and engineering source of truth.

Production domains:

- Frontend: `https://soukclick.ma`
- Backend: `https://api.soukclick.ma`

## Runtime Flow

1. Customer visits frontend.
2. Product and collection data is fetched from backend or statically hydrated depending on implementation phase.
3. Customer adds product to cart.
4. Cart drawer opens.
5. Checkout popup submits COD order to backend.
6. Backend validates customer data and fraud signals.
7. Backend stores order in PostgreSQL.
8. Backend sends order to Google Sheets webhook.
9. Backend sends server-side conversion events to Meta CAPI and TikTok Events API.
10. Frontend shows upsell.
11. Upsell acceptance updates order.
12. Customer lands on thank-you page.

## Services

### Frontend Service

- Next.js App Router.
- TypeScript.
- TailwindCSS.
- shadcn/ui.
- Zustand cart store.
- TanStack Query for API data.
- Zod and React Hook Form for forms.
- SwiperJS for galleries.
- Framer Motion for selected animations.

### Backend Service

- FastAPI.
- SQLAlchemy ORM.
- Alembic migrations.
- PostgreSQL database named `soukclick`.
- Optional Redis for rate limiting and suspicious velocity checks.
- Dockerized app server.

### Database

PostgreSQL stores:

- Products.
- Product media.
- Offers and bundles.
- Reviews.
- FAQs.
- Orders.
- Order items.
- Upsell events.
- Fraud checks.
- Tracking events.

### External Services

- Google Sheets webhook for operations.
- MaxMind for IP risk and country checks.
- Meta Pixel and Meta CAPI.
- TikTok Pixel and Events API.
- Snapchat Pixel.

## Environment-Based Configuration

All credentials and domains must use environment variables. No secrets in code.

Example internal database URL:

`postgresql+psycopg://soukclick:soukclick@soukclick_database:5432/soukclick`

## Deployment Shape

EasyPanel should run:

- `soukclick_frontend`
- `soukclick_backend`
- `soukclick_database`
- Optional `soukclick_redis`

Use Docker Compose locally and equivalent service definitions in EasyPanel.
