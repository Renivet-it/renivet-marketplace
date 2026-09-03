# Resource Assessment — P06

Per `docs/enhancement-improvements/01-portfolio/MASTER_REGISTER.md`, this Epic's engineering work is attributed to Ayan Ganguly (most items), consistent with other Epics in this program. No dedicated new headcount, infrastructure, or budget is implied by any V1 item — all are code-level fixes to existing, already-deployed integrations (PostHog, Meta CAPI/Pixel).

- REN-145, REN-131, REN-132, REN-133, REN-134: single-engineer, code-review-gated changes. No new environment, credentials, or vendor contract needed (Meta CAPI access token and PostHog keys already provisioned per `env.ts`).
- REN-166 (if approved): would need a GA4 property already provisioned (per growth-audit evidence, property 475794183 already exists and is receiving session data) — no new vendor onboarding, just event-instrumentation engineering time.
- REN-164: a QA/engineering verification task, no new resources.

No resource gap is identified for V1. The Remarketing_Sara/Reels business decision (BR-6) requires marketing/growth time, not engineering time, and can proceed independently and immediately.
