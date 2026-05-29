# Fraud Protection

## Goal

Souk Click protects Moroccan COD orders from obvious fake submissions while keeping real customers moving through checkout.

MaxMind is disabled by default and can be enabled later through env variables.

## Environment Variables

```env
FRAUD_TEST_PHONE=055000000
FRAUD_BLOCK_HIGH_RISK=false
ALLOWED_COUNTRY_CODE=MA

MAXMIND_ENABLED=false
MAXMIND_ACCOUNT_ID=
MAXMIND_LICENSE_KEY=
MAXMIND_MINFRAUD_ENABLED=false
MAXMIND_GEOIP_ENABLED=false
```

## Fraud Statuses

- `clean`: no meaningful risk flags.
- `review`: suspicious but order is still created.
- `blocked`: high-risk order blocked only when `FRAUD_BLOCK_HIGH_RISK=true`.
- `whitelisted`: test phone bypass.

## Rules Implemented

- Always allow phone `055000000`.
- Flag non-Morocco IPs when MaxMind country data exists.
- Flag VPN, proxy, and hosting IP risk when MaxMind data exists.
- Flag high MaxMind risk score.
- Flag duplicate recent phone orders.
- Flag too many orders from the same IP.
- Flag missing user agent.
- Flag repeated address or phone patterns.

## Default Behavior

By default:

```env
FRAUD_BLOCK_HIGH_RISK=false
```

Suspicious orders are created and marked:

```text
fraud_status=review
```

This is safer for COD operations because the confirmation team can decide instead of losing real customers.

## Blocking Behavior

If:

```env
FRAUD_BLOCK_HIGH_RISK=true
```

Then high-risk orders are blocked, except the whitelisted test phone.

Customer-facing error:

```text
ماقدرناش نكملو الطلب دابا، عافاك تواصل معنا فالواتساب.
```

Do not mention fraud, VPN, MaxMind, proxy, or risk score to the customer.

## Stored Fields

Orders store:

- `fraud_status`
- `fraud_score`
- `fraud_flags`
- `fraud_reason`
- `ip_country`
- `is_vpn`
- `is_proxy`
- `is_hosting`
- `maxmind_raw`

The `fraud_checks` table also stores each evaluation for auditing.

## Testing

Use test phone:

```text
055000000
```

This must always create the order and mark it as `whitelisted`.

Test duplicate protection by submitting the same real Moroccan phone twice. With blocking disabled, the second order should be created with `fraud_status=review`.

