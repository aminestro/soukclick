# Fake Order Prevention

## Goals

- Protect confirmation team from fake COD orders.
- Reduce wasted delivery attempts.
- Keep real Moroccan customers flowing smoothly.

## Required Checks

- Morocco-only IP allowlist.
- MaxMind IP risk check.
- VPN/proxy detection.
- Duplicate phone detection.
- Suspicious velocity detection.
- Phone format validation.

## Test Whitelist

Phone number:

`055000000`

This number bypasses fake order protections for testing. It should still create clearly marked test orders.

## MaxMind Rules

Use MaxMind API to check:

- Country code.
- Anonymous IP.
- VPN.
- Proxy.
- Hosting provider if available.
- Risk score if available.

Allow:

- Morocco IPs.
- Non-suspicious IPs.
- Whitelisted test phone.

Block or flag:

- Non-Morocco IPs.
- VPN/proxy/hosting traffic.
- High-risk IPs.
- Repeated phone submissions.

## Duplicate Phone Detection

Flag if same normalized phone has:

- Multiple orders in the last 24 hours.
- Multiple different names.
- Multiple different cities.
- Many rejected or unconfirmed orders historically.

## Velocity Detection

Flag if same IP submits:

- More than 3 orders in 30 minutes.
- More than 5 orders in 24 hours.

Use Redis for fast counters if available. PostgreSQL fallback is acceptable initially.

## Fraud Decisions

- `approved`: normal order.
- `review`: send to sheet but mark suspicious.
- `blocked`: do not accept order.
- `test`: whitelisted test order.

## Customer Message

If blocked, do not expose fraud logic. Use:

وقع مشكل فإرسال الطلب. عافاك تأكدي من المعلومات أو جربي مرة أخرى.

