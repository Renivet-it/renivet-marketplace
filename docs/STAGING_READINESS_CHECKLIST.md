# Staging Readiness Checklist

Joint sign-off gate — walk through together before any test that creates data runs on staging. Everything in the automated/manual testing plan is paused until this is fully checked and reviewed together.

## Pre-flight

- [ ] `src/lib/env-context.ts` (`isProductionEnvironment()`) merged and live on staging
- [ ] Brand order-notification email confirmed no-op under non-production (2a)
- [ ] Buyer order-confirmation email confirmed no-op under non-production (2b)
- [ ] Delhivery shipment/AWB creation confirmed no-op (placeholder waybill) under non-production (2c)
- [ ] Twilio WhatsApp notification confirmed no-op under non-production (2d)
- [ ] Meta CAPI event confirmed no-op under non-production (2e)
- [ ] All 4 Delhivery hardcoded-URL bypass sites fixed to respect `DELHIVERY_BASE_URL` and gated under non-production (2f)
- [ ] Meta CAPI token rotated in Meta Business settings
- [ ] Token moved to `FACEBOOK_CAPI_ACCESS_TOKEN` env var, staging/production configured

## Sandbox credentials

- [ ] Delhivery staging credentials confirmed sandboxed, OR explicit sign-off on kill-switch-only reliance
- [ ] Twilio staging confirmed test/sandboxed
- [ ] Resend staging confirmed test-mode or recipient-allowlisted

## Test fixtures

- [ ] Dedicated test brand created, `brand.email` pointing to a team-monitored inbox
- [ ] Test product (~₹3-4) created, clearly labeled (e.g. "TEST — DO NOT SHIP")

## Final verification

- [ ] One manual dry-run order placed on staging by the team, using the test brand/product
- [ ] Confirmed via the real Resend dashboard: no new email sent
- [ ] Confirmed via the real Twilio console: no new WhatsApp message sent
- [ ] Confirmed via the real Delhivery dashboard: no new shipment/AWB created
- [ ] Confirmed via the real Meta Events Manager: no new event recorded

## Sign-off

- [ ] Every item above confirmed done by the engineering team
- [ ] Joint review completed together
- [ ] Explicit go-ahead given to start Phase 1 (agent-browser installation) of the testing plan

Reference spec: `docs/STAGING_READINESS_FOR_TESTING.md`
