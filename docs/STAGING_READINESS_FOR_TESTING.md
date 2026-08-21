# Staging Readiness for Automated Testing

**Audience:** Renivet engineering team (implementation), reviewed jointly with the testing effort before sign-off.
**Status:** Draft spec — not yet implemented. See `docs/STAGING_READINESS_CHECKLIST.md` for the sign-off gate. Tracked in Linear under the "Staging Readiness" milestone of the **Automated Testing Rollout** project (REN-113 through REN-119).
**Why this exists:** The app has zero environment awareness today. Placing any order on **any deployment** — including local dev — unconditionally emails the real brand contact and buyer, sends a real Twilio WhatsApp message, fires a real Meta Conversions API `Purchase` event against the live ad account, and creates a real Delhivery shipment/AWB. The Delhivery shipment fires at order-*creation* time, not gated on payment success, so even a COD test order with no payment step hits Delhivery's live API. Automated or manual testing on staging cannot begin safely until this is fixed.

All line numbers below were verified directly against the current codebase (2026-08-21).

---

## 1. Environment-detection helper (new) — REN-113

No `isProduction`/`isStaging` helper exists anywhere in the codebase. `env.ts` already extends `@t3-oss/env-nextjs/presets`' `vercel()` preset, which validates `VERCEL_ENV` for us — so no schema changes are needed, only a small wrapper.

**New file: `src/lib/env-context.ts`**

```ts
import { env } from "@/../env";

/**
 * True when running on Vercel's production deployment (VERCEL_ENV), or when
 * running locally with NODE_ENV=production (e.g. a local production build).
 * Local dev and preview deployments resolve to false — side effects stay
 * off by default.
 */
export const isProductionEnvironment = () =>
    env.VERCEL_ENV === "production" ||
    (!env.VERCEL_ENV && env.NODE_ENV === "production");
```

**⚠️ Open question for the team, before this ships:** `VERCEL_ENV` only distinguishes environments *within a single Vercel project* (`production` / `preview` / `development`). If staging is a Vercel **Preview** deployment of this same project, the helper above works correctly out of the box. But if staging is deployed as its **own separate Vercel project** on its own domain — a common setup — then a deployment to that project's production branch also reports `VERCEL_ENV === "production"`, and this helper would incorrectly treat staging as real production, defeating every kill switch below. **Confirm which setup applies before merging.** If staging is a separate project, this needs a different signal instead — e.g. a dedicated `APP_ENV` var set explicitly per deployment target, not inferred from Vercel's own tiering.

---

## 2. External-side-effect kill switch — REN-114, REN-115

### 2a. Brand order-notification email — `src/lib/trpc/routes/general/orders.ts:644-669`

```ts
// before
try {
    await sendBrandOrderNotificationEmail({
        orderId: newOrder.id,
        brand: { id: brand.id, email: brand.email, name: brand.name, /* ... */ },
    });
    console.log(`Order confirmation email sent for order ${newOrder.id}`);
} catch (emailError) { /* ... */ }
```

```ts
// after
try {
    if (isProductionEnvironment()) {
        await sendBrandOrderNotificationEmail({
            orderId: newOrder.id,
            brand: { id: brand.id, email: brand.email, name: brand.name, /* ...unchanged */ },
        });
        console.log(`Order confirmation email sent for order ${newOrder.id}`);
    } else {
        console.log(
            `[non-prod] Skipped brand order-notification email for order ${newOrder.id} (would have emailed ${brand.email})`
        );
    }
} catch (emailError) { /* unchanged */ }
```

### 2b. Buyer order-confirmation email — `src/lib/trpc/routes/general/orders.ts:1362-1372`

Same pattern:

```ts
try {
    if (isProductionEnvironment()) {
        await sendOrderConfirmationEmail({
            orderId: newOrder.id,
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: "" },
        });
        console.log(`Order confirmation email sent for order ${newOrder.id}`);
    } else {
        console.log(
            `[non-prod] Skipped buyer order-confirmation email for order ${newOrder.id} (would have emailed ${user.email})`
        );
    }
} catch (emailError) { /* unchanged */ }
```

Note: there is a near-identical `sendBrandOrderNotificationEmail`/log block earlier in this file (around lines 658-668) that shares a copy-pasted "Order confirmation email sent" log message with 2a — not a separate third call site. Confirm during implementation that only these two genuine call sites are wrapped.

### 2c. Delhivery shipment/AWB creation — `src/lib/trpc/routes/general/orders.ts:956-958` (highest priority)

Fires at order-*creation* time for both COD and prepaid orders, so even a payment-free test order hits it. The response is read immediately afterward (`srOrder?.data?.success`, `srOrder.data.packages?.[0]` at lines 995-999, then `pkg?.waybill`/`pkg?.client`/`pkg?.sort_code` at lines 1014-1018) to persist AWB data — so downstream code needs a null-safe, *successful-looking* placeholder rather than a bare skip, so staging orders still flow through the normal "shipped" state for later journey/IDOR testing instead of always looking like a failed shipment.

`createDelhiveryOrder` (in `src/lib/delhivery/orders.ts`) returns `{ success: true, data: <Delhivery's raw JSON> }` on success.

```ts
// before
const srOrder = await createDelhiveryOrder(delhiveryPayload);
console.log("✅ Delhivery Response:", srOrder);
```

```ts
// after
let srOrder: Awaited<ReturnType<typeof createDelhiveryOrder>>;
if (isProductionEnvironment()) {
    srOrder = await createDelhiveryOrder(delhiveryPayload);
} else {
    console.log(
        `[non-prod] Skipped Delhivery shipment creation for order ${newOrder.id} (payload logged above), using placeholder waybill`
    );
    srOrder = {
        success: true,
        data: {
            success: true,
            packages: [
                {
                    waybill: `TEST-WAYBILL-${newOrder.id}`,
                    client: "TEST-CLIENT",
                    sort_code: "TEST",
                },
            ],
        },
    };
}
console.log("✅ Delhivery Response:", srOrder);
```

### 2d. Twilio WhatsApp notification — `src/lib/razorpay/payment.ts:228-249`

```ts
// before
await sendWhatsAppNotification({
    phone: formattedPhone,
    template: "order_confirmation",
    parameters: [user.firstName, orderId],
});
console.log("WhatsApp notification sent successfully");
```

```ts
// after
if (isProductionEnvironment()) {
    await sendWhatsAppNotification({
        phone: formattedPhone,
        template: "order_confirmation",
        parameters: [user.firstName, orderId],
    });
    console.log("WhatsApp notification sent successfully");
} else {
    console.log(
        `[non-prod] Skipped WhatsApp notification to ${formattedPhone} for order ${orderId}`
    );
}
```

### 2e. Meta CAPI event — `src/lib/fb-capi.ts` (`sendCapiEvent`)

Gate inside the function itself — this is the single choke point every caller across the codebase already goes through, so one change covers all of them.

```ts
// after — insert right after the existing `if (!ACCESS_TOKEN)` guard
if (!isProductionEnvironment()) {
    console.log(
        `[non-prod] Skipped Meta CAPI event '${eventName}' (would have fired against the live ad account, event ID ${eventId})`
    );
    return { skipped: true };
}
```

(Requires `import { isProductionEnvironment } from "./env-context";` — sibling file under `src/lib/`.)

### 2f. Four hardcoded Delhivery production-URL bypass sites

These bypass the `DELHIVERY_BASE_URL` override that the rest of the Delhivery integration already respects (see `src/lib/delhivery/client.ts:4`, and the same pattern already used correctly in `src/lib/services/corporate-platform.ts:949,3333`). Not required for the initial golden-path order-placement test, but required before any later phase touches order tracking or returns/replace flows.

- `src/actions/order-tracking.ts:21` (`getLiveTrackingByAwb`)
- `src/lib/trpc/routes/general/orders.ts:2076` (waybill dimension edit)
- `src/lib/trpc/routes/general/returnReplace.ts:695` (RTO/return creation)
- `src/lib/trpc/routes/general/returnReplace.ts:842` (replacement creation)

**Fix, two parts:**

1. Replace the hardcoded string with the env-override pattern, matching the `.trim()` convention from `client.ts:4`:

   ```ts
   // before
   `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}`
   // orders.ts:2076 uses "https://track.delhivery.com/api/p/edit"
   // returnReplace.ts:695,842 use "https://track.delhivery.com/api/cmu/create.json"
   ```

   ```ts
   // after — same substitution at each site, keeping its existing path suffix
   `${(process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com").trim()}/api/v1/packages/json/?waybill=${awb}`
   ```

2. Wrap each call the same way as 2c — no-op under non-production, since once staging points `DELHIVERY_BASE_URL` at a sandbox account these become live calls against that sandbox rather than dead code, but until that sandbox exists (see section 4) they should stay gated like the other Delhivery call.

---

## 3. Secret rotation — Meta CAPI token — REN-116

The hardcoded token in `src/lib/fb-capi.ts:12-13` is exposed in git history (tracked as REN-92 in the Security & Compliance Audit project — that issue is the finding, this section is the staging-readiness remediation). Moving it to an env var alone does **not** revoke the exposed one — it must be rotated:

1. Regenerate the token in Meta Business settings (System User or Access Token, whichever was used to generate the current one).
2. Add `FACEBOOK_CAPI_ACCESS_TOKEN` to `env.ts`'s `server` schema and `runtimeEnv` block, following the existing pattern (e.g. `RESEND_API_KEY`).
3. Set it in Vercel's environment variables (production scope only — staging doesn't need it once section 2e's gate is in place, since the call becomes a no-op there anyway; keeping it out of staging is an extra layer of protection).
4. Replace `fb-capi.ts:12-13`:
   ```ts
   // before
   const ACCESS_TOKEN = "EAAPw9al...";
   // after
   import { env } from "@/../env";
   const ACCESS_TOKEN = env.FACEBOOK_CAPI_ACCESS_TOKEN;
   ```
5. Confirm the old token no longer works by checking Meta Business settings shows it revoked after rotation.

---

## 4. Sandbox credentials for staging — REN-117 — itemize and action or decline each

| Provider | Action needed |
|---|---|
| **Razorpay** | No test-mode keys required — see the human-supervised payment-testing approach in section 6 instead. |
| **Delhivery** | Get a dedicated non-production account/token if Delhivery offers one, set as staging's `DELHIVERY_BASE_URL`/`DELHIVERY_TOKEN`. If Delhivery has no sandbox tier, explicit written sign-off that staging relies solely on the section 2c/2f code-level kill switch with no second layer — flag this as the highest-consequence integration (real shipments) if declined. |
| **Twilio** | Test credentials or a dedicated test WhatsApp sender/number for staging. |
| **Resend** | A test-mode key, or a recipient allow-list restricted to team-controlled inboxes. |

---

## 5. Dedicated internal test brand + test product — REN-118

One brand account the team owns end-to-end — `brand.email` pointing to an inbox the team actually monitors, not a real partner seller — with one cheap product (~₹3-4) clearly labeled as a test item (e.g. "TEST — DO NOT SHIP"). This removes the "a real outside seller gets notified" risk independent of any code change above, and is the target for the manual payment check below.

---

## 6. Payment-flow testing — human-supervised, not Razorpay sandbox keys — REN-118

Razorpay's OTP/payment-authorization step requires a real human action regardless of test or live keys — that's genuine 2FA, it can't be automated by design. Rather than blocking on Razorpay test-mode credentials, use the dedicated test brand/product (section 5) for an occasional, deliberate, human-supervised check: drive the journey up to the Razorpay payment modal, a person manually completes the actual ₹3-4 payment, then resume to verify post-payment state.

This is **not** part of the repeatable automated suite — it runs occasionally, by request, with the team manually cancelling the resulting real Delhivery shipment afterward each time (the section 2c/2f kill switch doesn't apply here, since this is a deliberately real transaction). The repeatable, unattended suite always stops at the payment modal without submitting.

---

## Summary of files touched

- **New**: `src/lib/env-context.ts`
- **New env var**: `FACEBOOK_CAPI_ACCESS_TOKEN` in `env.ts`
- **Edited**: `src/lib/trpc/routes/general/orders.ts` (2 email sites + 1 Delhivery creation site + 1 URL-bypass site)
- **Edited**: `src/lib/razorpay/payment.ts` (1 WhatsApp site)
- **Edited**: `src/lib/fb-capi.ts` (gate + token rotation)
- **Edited**: `src/actions/order-tracking.ts`, `src/lib/trpc/routes/general/returnReplace.ts` (3 more URL-bypass sites)

Sign-off gate: `docs/STAGING_READINESS_CHECKLIST.md` (REN-119).
