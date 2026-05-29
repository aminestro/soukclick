# Security Rules

## Secrets

- Never commit real API keys.
- Use environment variables.
- Rotate keys if leaked.

## API Security

- Validate all input with Pydantic.
- Rate limit checkout endpoints.
- Use CORS only for allowed frontend domain.
- Sanitize webhook payloads.
- Do not expose internal error traces.

## Customer Data

Collected data:

- Name.
- Phone.
- City.
- Address.

Use only for:

- Order confirmation.
- Delivery.
- Fraud prevention.
- Conversion tracking where legally acceptable.

## Fraud Protection

- Enforce Morocco-only IP policy unless whitelisted.
- Use MaxMind.
- Detect duplicate phone orders.
- Detect suspicious velocity.

## Admin Future

When admin is added:

- Use strong authentication.
- Add role-based permissions.
- Log sensitive actions.
- Never expose raw secrets in admin UI.

