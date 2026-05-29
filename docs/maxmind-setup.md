# MaxMind Setup

## Goal

Use MaxMind minFraud and GeoIP signals to improve COD fake order review decisions.

MaxMind is disabled by default.

## Environment Variables

```env
MAXMIND_ENABLED=false
MAXMIND_ACCOUNT_ID=
MAXMIND_LICENSE_KEY=
MAXMIND_MINFRAUD_ENABLED=false
MAXMIND_GEOIP_ENABLED=false
FRAUD_BLOCK_HIGH_RISK=false
```

## Enable Later

1. Create a MaxMind account.
2. Generate a license key.
3. Add account ID and license key to backend env.
4. Start with:

```env
MAXMIND_ENABLED=true
MAXMIND_GEOIP_ENABLED=true
MAXMIND_MINFRAUD_ENABLED=false
FRAUD_BLOCK_HIGH_RISK=false
```

5. Review orders for a few days.
6. Enable minFraud scoring:

```env
MAXMIND_MINFRAUD_ENABLED=true
```

7. Only after confidence, optionally enable blocking:

```env
FRAUD_BLOCK_HIGH_RISK=true
```

## Signals Used

- Country code.
- Anonymous VPN.
- Public proxy.
- Hosting provider.
- minFraud risk score.

## Morocco Policy

Allowed country:

```env
ALLOWED_COUNTRY_CODE=MA
```

Non-Morocco IPs are flagged. They are blocked only when total risk is high and blocking is enabled.

## Operational Advice

Do not start with automatic blocking. Moroccan COD traffic can include shared networks, office networks, and unusual mobile carrier routing. Start with review mode and use confirmation team feedback.

