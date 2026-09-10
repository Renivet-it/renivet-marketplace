# REN-191 — Remediate ASVS upload-limit and insecure catalog transport failures

## Outcome

Close the two confirmed engineering failures from REN-125 without breaking authorized brand-media uploads or customer catalog availability.

## Scope

1. Replace the permissive `brandMediaUploader` policy with explicit per-type limits.
2. Centralize the embedding-service base URL and remove every hardcoded production HTTP endpoint from both search routes, catalog RAG, embedding generation, and recommendations.
3. Preserve authentication/authorization and fail open to existing database/text-search behavior when the optional external service is unavailable or misconfigured.
4. Add focused tests for limits, URL validation, URL construction, and safe fallback behavior.

## Proposed design

### Upload policy

Export a typed `BRAND_MEDIA_UPLOAD_LIMITS` constant and use it directly in the UploadThing router. Use exact MIME keys rather than broad aliases. Recommended limits:

| Type | Maximum size | Maximum files per request |
|---|---:|---:|
| `image/jpeg`, `image/png`, `image/webp` | 8 MB | 20 each |
| `video/mp4`, `video/webm` | 64 MB | 5 each |
| `audio/mpeg`, `audio/wav` | 32 MB | 10 each |
| `application/pdf` | 16 MB | 10 |
| `text/plain`, `text/csv` | 1 MB | 10 each |

Remove generic `blob` acceptance because it bypasses a meaningful allowlist. The provider validates declared MIME plus size/count; content-signature scanning is not available in this route and is not claimed. The client submits one MIME family per UploadThing request, so the provider's per-key count is the request bound; mixed-family aggregate enforcement is not available without splitting the endpoint. Existing permission middleware remains unchanged.

### Secure service URL

Add `EMBEDDING_SERVICE_URL` as an optional server environment value and centralize parsing in a server-only helper. It must be an origin only: no credentials, path other than `/`, query, or fragment. HTTPS is mandatory. Loopback HTTP (`localhost`, `127.0.0.1`, `[::1]`) is allowed only when `APP_ENV` is absent/development and `NODE_ENV` is not production. Staging and production always reject HTTP. The value is trusted operator configuration rather than user input; private HTTPS origins remain allowed for private service networking. Invalid or absent configuration disables the optional integration and emits only a structured reason code.

All six active calls across five files use the helper: two API routes, catalog RAG, two embedding methods, and product recommendations. Requests use a five-second timeout, zero automatic retries, and `redirect: "error"` for fetch. Axios redirects are disabled. Request paths and query parameters are built with `URL`, not string concatenation. Responses must match their expected array/vector shape; malformed responses follow the existing failure contract.

Fallback remains caller-specific: both API routes return `[]`; catalog RAG retains database/text search with no RAG IDs; embedding helpers throw a generic local error as today (so product-write callers preserve their current failure handling); the recommendation helper throws a generic local error, preserving existing public and cart caller behavior. No raw query, full URL, Axios error/configuration, or upstream body is logged or propagated.

## Security boundaries

- Authorization on `brandMediaUploader` is unchanged.
- No TLS verification bypass or insecure production fallback is permitted.
- No environment value, credential, query containing customer data, or response body is logged by new diagnostics.
- The service remains optional: configuration/provider failure must not fail catalog browsing.

## Verification

- Static assertion that the insecure IP URL and production-capable `http://` service calls are absent.
- Unit tests for each upload limit and removal of generic blob support.
- Unit tests for HTTPS acceptance, loopback development acceptance, non-loopback HTTP rejection, missing/invalid values, path construction, and query encoding.
- Regression tests for search/recommendation fallback behavior.
- Full `bun test`, formatting/type checks appropriate to changed files, governance validation, and `$renivet-review REN-191`.

## Deployment

Production must provide `EMBEDDING_SERVICE_URL` with the HTTPS origin of the existing service. If absent or invalid, optional RAG/recommendation calls remain disabled while catalog fallback remains operational.

Deployment order: provision and verify the HTTPS origin first, configure Preview, run endpoint smoke checks, configure Production, deploy the application, and monitor structured outcomes (`disabled_config`, `timeout`, `network_error`, `upstream_status`, `invalid_response`) without query/URL data. Rollback removes/disables the environment value, which safely disables optional service calls.

## Approval decision

Two decisions require owner confirmation before implementation: the exact upload MIME/limit policy, and the deployable HTTPS service origin plus confirmation that it will be configured before rollout.

## Known exclusions

Provider-file cleanup after a later media-database write failure is a pre-existing consistency concern and is not worsened by this limits change. Reworking that two-stage persistence flow is outside REN-191.
