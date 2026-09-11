# AI Security Review — P08

## Existing self-hosted embedding service — do not reuse as-is in production for P08

Confirmed this pass by live test call: `http://64.227.137.174:8000` has **no authentication** (plain JSON POST, no API key, no signed request), is reachable from outside Renivet's network, and has no visible rate limiting. This is already a live characteristic of Renivet's production search/recommendation path (P01/P02 depend on it today) — this review does not re-litigate that existing risk, but it means **P08 must not add a new consumer to this exact unauthenticated endpoint without the hardening REN-146 is already scoped to provide** (timeout, and ideally auth, though auth wasn't in REN-146's original scope — worth flagging as a gap).

**Data leaving Renivet:** any text sent to this service (column headers, attribute values) leaves Renivet's network to an unauthenticated third-party-adjacent VPS. For P08's schema-mapping/attribute-normalization use cases, the data in question is **structural metadata (column names, attribute values), not customer PII or financial data** — a materially lower sensitivity class than, say, customer order data. Still, brand-identifying business data (their column naming conventions, product attribute vocabularies) does leave the network boundary.

## Hosted LLM fallback (recommended for schema mapping residual)

- **Data leaving Renivet:** yes, by design — column names and a small number of representative sample values would be sent to a third-party hosted LLM API. This is a real, deliberate trust boundary crossing.
- **Credentials/secrets:** an API key would need to be stored in Renivet's existing secrets management (same pattern as Razorpay/Delhivery keys) — no new credential-handling pattern needed.
- **Tenant isolation:** each brand's mapping request must be processed independently — no cross-brand data should ever appear in the same prompt/context window. This is an implementation requirement for whoever builds this, not yet implemented (nothing is implemented for P08 at all).
- **Logging:** input/output logging (required by `AI_MLOPS_REQUIREMENTS.md`) must not log full customer/financial data — for schema mapping this is naturally low-risk (column names, not customer records), but the logging policy should still be scoped explicitly to avoid ever accidentally including a customer-data sample value.
- **Model input/output privacy:** depends entirely on the hosted provider's data-retention/training-use policy — this must be checked against whichever specific provider is chosen (not decided by this pass) before any real brand data is sent, even structural metadata.
- **Network exposure:** standard outbound HTTPS, same risk class as Renivet's existing external integrations.
- **Authentication:** standard API-key auth, materially better than the existing embedding service's no-auth posture.

## Recommendation

**Do not directly reuse the existing unauthenticated embedding service for a new P08 consumer without at minimum the same hardening REN-146 already scopes for its existing consumers** (timeout, and ideally basic auth — auth hardening is a gap in REN-146's current scope worth flagging back to whoever owns it). For the hosted-LLM component, choose a provider with an enterprise/business-tier data-retention policy (no training on submitted data) before sending any brand-supplied text, even non-PII structural metadata.
