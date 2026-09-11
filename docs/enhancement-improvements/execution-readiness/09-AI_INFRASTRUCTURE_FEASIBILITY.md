# Gate L/17 — AI Infrastructure Feasibility & Vercel Safety

## Infrastructure requirements for the recommended option (hosted LLM fallback, Option E)

| Resource | Requirement |
|---|---|
| Model storage | None — no weights hosted by Renivet |
| RAM/VRAM/CPU/GPU | None — no local inference process |
| Disk | Negligible — request/response logs only |
| Network | Outbound HTTPS from the Vercel function/server action making the API call, to the LLM provider's endpoint |
| Runtime | Standard Node.js server-side call (tRPC procedure or route handler), same as any other external API call Renivet already makes (Razorpay, Delhivery, Meta CAPI) |
| Inference latency | Hundreds of milliseconds to a few seconds per call, acceptable because no task in Gate I's decomposition sits on a customer-facing request path |
| Throughput/concurrency | Low — deduplicated call volume (Gate 20), well within any standard hosted API's rate limits at Renivet's current scale |

**This is categorically different from, and far cheaper/safer than, self-hosting a model** (Options C/D from the prior gate) — no GPU/CPU provisioning, no model-serving process to monitor, no capacity planning.

## Gate 17 — Vercel safety check

**Can inference execute inside Vercel serverless functions safely?**

Distinguish two different questions the source prompt conflates:

1. **"Can a model's weights run inside a Vercel function?"** — **NO.** Vercel serverless functions are not suited to hosting model inference in-process: memory limits, cold starts, and no GPU access make this unsafe and is explicitly not recommended, matching the concern the infrastructure audit already raised about the Vercel function-duration/cost problem.
2. **"Can a Vercel function make an outbound HTTPS call to a hosted LLM API?"** — **YES, safely**, and this is exactly what Option E (the recommendation) does. This is architecturally identical to Renivet's existing pattern of calling Razorpay/Delhivery/Meta CAPI from serverless functions — a standard external API call, not in-process inference.

**The architecture must not recreate the Vercel function-duration/cost problem the infrastructure audit already found** (REN-138's CAPI sequential-unguarded-calls issue is the cautionary precedent). Applying the same discipline here: every P08 AI call must have an explicit timeout (learn from REN-146's absence-of-timeout lesson on the *existing* embedding service — do not repeat that mistake on the *new* AI-assist calls), must not block the customer-facing request path (P08's AI-assist calls only ever happen inside the brand-admin onboarding/mapping flow, never in a customer-facing checkout/search/browse path), and should run via the same "gate the call, dedupe first, cache the result" discipline as Gate 20 requires.

## Preferred pattern (confirmed as appropriate for P08 V1)

```
Brand-admin upload UI
  → application layer (tRPC procedure)
    → deterministic mapping pass (alias dict, normalized match)
      → [only for genuinely unresolved residual]
        → hosted LLM API call (structured JSON output, timeout-bound)
      → human confirmation (always, regardless of confidence)
    → policy engine (confidence tier, never auto-apply for identity)
    → deterministic write
```

This matches `MCP_GOVERNANCE.md`'s already-established preferred shape (MCP/AI → application API → policy engine → deterministic core) even though MCP itself is not applicable here (see the MCP feasibility gate).

## Recommendation to existing infra: fix REN-146 before adding a second consumer pattern

Not a requirement for P08 specifically, but worth stating: Renivet is about to have two independent external-call patterns needing the same timeout/reliability discipline (the existing embedding/RAG service, and any new hosted-LLM calls for P08). REN-146's fix (timeouts + real config) should be treated as the template both patterns follow, not solved twice.
