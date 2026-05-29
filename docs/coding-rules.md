# Coding Rules

## General

- Use TypeScript in the frontend.
- Use Python typing in the backend.
- Keep business logic testable.
- Do not store secrets in code.
- Prefer explicit names over clever abstractions.
- Build from existing docs before inventing new behavior.

## Frontend

- Use Next.js App Router.
- Use server components by default when possible.
- Use client components only for interaction.
- Use shadcn/ui for base UI.
- Use Zustand for cart and checkout UI state.
- Use TanStack Query for API calls and mutations.
- Use Zod schemas for form validation.
- Use React Hook Form for checkout.
- Keep tracking calls centralized.

## Backend

- Use FastAPI routers grouped by domain.
- Use Pydantic schemas for request and response validation.
- Use SQLAlchemy models and Alembic migrations.
- Keep services separate from route handlers.
- Calculate prices on the backend.
- Normalize phone numbers on the backend.

## Testing

Minimum tests:

- Moroccan phone validation.
- Pricing calculation.
- Fraud whitelist behavior.
- Order creation.
- Upsell update.
- Tracking event payload building.

## File Hygiene

- Keep frontend and backend separate.
- Keep docs updated when behavior changes.
- Do not mix generated assets with source code without clear folders.
- Keep placeholder media easy to replace.

