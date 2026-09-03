# Infrastructure Benchmark

## What this pass actually measured

Qwen3-Embedding-0.6B was downloaded (1.2GB, measured) and run successfully **on ordinary CPU hardware, in a disposable Python venv, on the machine running this benchmark** — no GPU, no special provisioning. Cold-start model load took 65.3s; warm inference averaged ~100-120ms per short text. This confirms self-hosting a small embedding model is technically feasible without GPU infrastructure, if Renivet ever chose to.

## Infrastructure options evaluated

| Option | Verdict for P08 V1 | Reasoning |
|---|---|---|
| A. Existing CPU infrastructure (Vercel functions) | **Not for hosting a model** — feasible only for making outbound API calls | Vercel serverless functions are not suited to in-process model loading (cold start, memory limits, no persistent process) |
| B. Existing VPS (the current embedding service's host) | **Not recommended as-is** — unauthenticated, unhardened, already a shared dependency for P01/P02 | Adding a new consumer to unhardened shared infrastructure is the coupling risk already flagged in `AI_SECURITY_REVIEW.md` |
| C. Existing Python inference service | Same as B | Same reasoning |
| D. New dedicated CPU inference service | **Technically feasible (this pass proves it), but not justified for V1** | Requires someone to operate a new service — no evidence Renivet has this operational capacity today (established across multiple prior SRS/reconciliation passes: "no dedicated ML engineer needed" was itself a finding, meaning no ML-ops role exists to staff this) |
| E. New GPU inference service | **Not needed** | This benchmark proves a 0.6B model runs fine on CPU — a GPU service would be unjustified extra cost/complexity for this workload |
| F. Vercel/serverless calling a hosted API | **Recommended** | Standard outbound HTTPS call pattern, identical in shape to Renivet's existing Razorpay/Delhivery/Meta integrations — no new infrastructure category |

## Why the technically-feasible option (D, self-hosting Qwen3) is still not the V1 recommendation

This benchmark proves self-hosting Qwen3-Embedding-0.6B is *possible* without GPU — but "possible" and "the right choice for a team with no evidenced ML-ops capacity" are different questions. Standing up and operating even a lightweight CPU inference service is a new operational commitment (uptime, monitoring, restart-on-crash, capacity planning as usage grows) that a stateless call to a hosted API avoids entirely. See `FINAL_AI_DECISION.md` for how this resolves against the decision rule (simplest option that meets requirements).
