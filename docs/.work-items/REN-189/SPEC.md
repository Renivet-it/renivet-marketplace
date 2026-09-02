# REN-189 — Meta CAPI Event Match Quality and Analytics Signal Integrity

## Status

`IN_REVIEW` pending independent Critic review and governance validation. This artifact specifies the work only; it does not implement the issue.

## Objective

Improve Meta Event Match Quality and CAPI signal integrity for real users without changing SEO, crawler access, checkout behavior, or customer-facing page rendering.

The design suppresses Meta analytics for clear crawler requests, makes browser identifiers more reliable, centralizes eligible customer-data enrichment, preserves Pixel/CAPI deduplication, and stops new CAPI logs from persisting raw customer PII.

## Evidence

The stakeholder supplied `capi-logs-all-1788378144506.csv`.

- 889 accepted CAPI events; 887 are `ViewContent`.
- 598/889 (67.3%) have bot/crawler-like user agents.
- Email appears on 7/889 (0.8%); phone appears on 0/889.
- `fbp` appears on 47/889 (5.3%); `fbc` appears on 34/889 (3.8%).
- No `Purchase` events are present in this export, so Purchase quality is not validated by it.
- The stakeholder screenshot shows `ViewContent` EMQ at 3.1/10.
- Crawler examples include `facebookexternalhit`, `meta-externalads`, Googlebot, Amazonbot, ClaudeBot, GPTBot, Bingbot, and AhrefsBot.
- The export contains raw customer data, including an email address, in CAPI log fields.

Interpretation: the export is dominated by server-side ViewContent requests that are not customers and usually have no matchable customer identifiers. This is the primary quality hypothesis to test. The CSV is not evidence that every missing identifier is an implementation defect; anonymous, consent-denied, and non-ad traffic are legitimate cases.

## Product and safety boundaries

Crawler requests must continue to receive normal product pages. No `robots.txt`, response, metadata, canonical tag, JSON-LD, product content, image, link, or indexing behavior may change. Only Meta marketing-event emission is suppressed.

No fabricated, placeholder, or synthetic customer data may be sent to Meta. Date of birth and gender must not be collected solely to improve EMQ. Existing order, payment, checkout, PostHog, and side-effect-gate behavior remains intact. Raw values may remain in Renivet CAPI logs when present, subject to the existing authorized dashboard/export boundary.

## Requirements

### REQ-001 — Safe crawler analytics suppression

Introduce a reusable, conservative `isLikelyBot(userAgent)` decision used before server-side browser-behavior events are scheduled or sent. It must recognize clear crawler signatures, while allowing ordinary desktop and mobile browsers. It must not block page access.

### REQ-002 — Controlled rollout and diagnostics

Bot suppression must be controlled by a reversible feature flag/configuration. Suppressed-event diagnostics may contain only event name, reason, user-agent category, and timestamp/counter data; they must not contain raw customer data.

### REQ-003 — Browser identifier integrity

For eligible human browser traffic, capture and forward `_fbp`, `_fbc` when available, and valid `fbclid`-derived click context, together with the original IP address and user agent. Preserve `fbp`/`fbc` exactly as received, never hash them, and never invent `fbc` when no Meta click exists.

### REQ-004 — Centralized eligible customer identity

Use one shared server-side builder for available, consent-eligible customer data across ViewContent, AddToCart, InitiateCheckout, and Purchase: email, phone with country code, first name, last name, city, state, postcode, country, and stable `external_id`. For registered users, combine profile and saved-address data. For checkout events, selected shipping address takes precedence over saved primary address, which takes precedence over profile/request data. If no customer address exists, use trusted hosting/request IP geolocation as a best-effort fallback: country first, then state/region and city only when supplied by a trusted source. Normalize and hash personal fields exactly once for the outbound Meta contract; omit invalid or unavailable values. The Renivet CAPI log retains the raw input values according to the approved Point 1 decision.

### REQ-005 — Pixel/CAPI event integrity

Pixel and CAPI representations of the same event must use the same event name and stable `event_id`, without re-render or repeated-server duplicate emission. Existing customer-visible flows remain non-blocking.

### REQ-006 — Purchase correctness compatibility

Purchase must remain one event per complete customer order, with the REN-145 full-order behavior, correct INR rupee value, order ID, all product IDs, item count, and available eligible customer identifiers. Partial order creation must not emit Purchase.

### REQ-007 — Authorized raw CAPI logs

New CAPI logs must retain the raw customer and request values that were actually supplied, including profile, address, IP, browser, and click identifiers, so authorized Renivet operators can inspect the complete payload. Meta outbound hashing/normalization remains separate from Renivet log storage. Provider outcomes and diagnostics remain useful and compatible with the existing CAPI dashboard/export authorization boundary. Historical rows are not retroactively rewritten by this task.

### REQ-008 — Quality observability and SEO verification

Expose or produce privacy-safe measurements separating human traffic, crawler suppression, anonymous/authenticated traffic, identifier coverage, event outcomes, and Pixel/CAPI deduplication. Verify crawler page rendering and SEO artifacts remain unchanged.

## Scenarios

- **SCN-001:** A clear Google/Meta/other crawler requests a product page. The page, metadata, JSON-LD, response, and indexing access remain normal; server-side Meta marketing emission is skipped when the flag is enabled.
- **SCN-002:** A normal desktop or mobile browser requests a product page with no identifiers. The page renders and eligible anonymous telemetry is sent without fabricated identity data.
- **SCN-003:** A real browser has `_fbp` and a valid Facebook click context. CAPI receives the unchanged browser identifiers and the Pixel/CAPI event remains deduplicable.
- **SCN-004:** An authenticated customer has account and address data. Profile fields and address fields are combined; selected checkout address wins over saved primary address, which wins over profile/request fallback, and all available valid fields are enriched consistently for Meta while raw supplied values remain visible in authorized Renivet logs.
- **SCN-004A:** A guest has checkout identity/address data or only request location. Supplied guest values are used first; trusted IP geolocation fills only missing country/state/city values where available, with no invented location.
- **SCN-005:** A customer denies/does not provide optional identity data. The event omits unavailable fields and remains valid; no placeholder values are generated.
- **SCN-006:** Pixel and CAPI send the same event. A single stable event ID is used and React re-render/repeated invocation does not create unintended duplicates.
- **SCN-007:** A complete single-brand or multi-brand order succeeds. One correct full-order Purchase is emitted and REN-145 behavior remains intact.
- **SCN-008:** A brand order creation partially fails or telemetry fails. No false Purchase is emitted for an incomplete order, and checkout/order state is not failed by telemetry.
- **SCN-009:** A CAPI event is logged. Logs retain the raw supplied payload for authorized operators, while Meta outbound processing remains correctly normalized/hashed and provider credentials are never logged.
- **SCN-010:** Provider, network, consent, cookie, or database failures occur. Failures are bounded, observable, and cannot block page rendering, checkout, payment, or order lifecycle.

## Invariants

- **INV-001:** Analytics suppression never changes page accessibility, SEO output, crawler rendering, or indexing controls.
- **INV-002:** Only clear crawler traffic is suppressed; normal-browser traffic is not excluded by generic or malformed matching.
- **INV-003:** No Meta payload contains fabricated identity values; unavailable data is omitted.
- **INV-004:** `fbp` and `fbc` are preserved as raw Meta identifiers and are never passed through personal-data hashing.
- **INV-005:** Personal identity fields are normalized and hashed exactly once before provider submission; Renivet logs retain the raw supplied values only within the existing authorized log boundary and never contain provider credentials.
- **INV-006:** Pixel/CAPI pairs use the same event name and stable event ID; one channel’s telemetry failure cannot duplicate or alter the other.
- **INV-007:** Telemetry cannot change customer business state, including product rendering, payment, checkout, order creation, or completed-order semantics.
- **INV-008:** Existing REN-145 full-order Purchase semantics and correct rupee units remain true for both checkout implementations.

## Flows

- **FLOW-001:** Request arrives → capture user agent and request data → classify crawler → if eligible, schedule/send CAPI; if suppressed, record privacy-safe counter → render page unchanged.
- **FLOW-002:** Browser event starts → collect consent-eligible browser identifiers → combine with centralized customer identity → normalize/hash according to contract → send Pixel/CAPI with one event ID → observe bounded failures.
- **FLOW-003:** Order completes → verify all expected brand orders succeeded → build full-order Purchase payload → emit one Pixel/CAPI pair with shared ID → log safe outcome.

## Architecture and boundaries

Bot classification belongs at the shared server-side analytics boundary so product-page callers cannot accidentally bypass it. The detector must be independently unit-tested and feature-flagged. The page must not branch its rendered content based on the classification.

The rollout control is a dedicated server-readable setting, `META_CAPI_SUPPRESS_CRAWLERS`. It defaults to disabled when absent or unreadable, and a flag-read failure emits only a non-PII diagnostic. Production enablement is an explicit operator action. When enabled, only a clear bot match suppresses the event; uncertain user agents fail open. The existing external-side-effect gate remains a separate prerequisite.

For click context, `_fbc` has precedence when present and valid. Otherwise, a consent-eligible `fbclid` captured from the initial landing URL may be converted once to Meta’s documented `fb.1.<timestamp_ms>.<fbclid>` format, persisted/forwarded as `_fbc`, and used unchanged thereafter. The raw `fbclid` is not sent as a substitute for `fbc`. No `fbc` is created without a valid click ID, and no identifier is created when consent rules prohibit the relevant cookie/storage operation.

Request-derived values must remain server-only where required. Meta access tokens, database clients, and provider calls remain server-only. Existing CAPI dashboard authorization is unchanged. The CAPI logger must project safe diagnostic data before persistence rather than relying on UI redaction.

The new persisted diagnostic projection is fixed and excludes raw identity values: `userData` stores `field_presence` booleans for `em`, `ph`, `fn`, `ln`, `db`, `ge`, `ct`, `st`, `zp`, `country`, `external_id`, `fb_login_id`, `fbp`, and `fbc`; `transport` booleans for IP and user-agent presence plus a coarse user-agent category; and `identifier_validity` booleans for `fbp`/`fbc`. `customData` stores only event-safe aggregates: currency, numeric value, content type, content-ID count, item count, and `has_order_id`; it omits titles, categories, URLs, raw IDs, and other unnecessary data unless an approved non-PII operational field is required. Provider responses are projected to version, outcome, HTTP status, safe code, and redacted message. The dashboard and CSV export consume this safe shape. Existing rows are not rewritten by this task, but their raw identity/custom-data fields must be redacted or omitted at read/export time and labeled legacy; no new UI may reveal them.

Event-ID ownership is explicit. ViewContent event IDs are request-scoped and generated once by the server page, then passed to both browser and CAPI paths. AddToCart and InitiateCheckout IDs are generated once per user action and reused across both channels. Purchase owns a stable order-scoped ID derived from the canonical completed customer-order identity; where a full customer order consists of multiple persisted brand order IDs, use a deterministic hash of the sorted completed order IDs and checkout/payment intent identity. Retries or page refreshes for the same completed order reuse that ID. Meta deduplication is required, and operational counts use unique event IDs. No automatic retry or duplicate order creation is introduced by this task; if the existing order flow cannot supply a stable completed-order identity, implementation must stop at a documented design blocker rather than use a new random Purchase ID.

The design does not authorize a queue, automatic retry, database migration, token rotation, or a new consent/legal interpretation. REN-145, REN-138, and REN-133 remain coordination dependencies.

## Decisions

- **DEC-001:** Suppress clear crawler traffic only from Meta analytics. Class: `RECOMMEND_CONTINUE`; status: `resolved`; basis: the CSV contains 67.3% crawler-like events and crawlers are not customers, while page access remains unaffected; confidence: high; consequence: medium; human confirmation required: false.
- **DEC-002:** Use a conservative user-agent detector with an explicit allow/false-positive test set and a reversible flag. Class: `RECOMMEND_CONTINUE`; status: `resolved`; basis: user-agent evidence is available, but imperfect classification must fail open for uncertain traffic; confidence: medium; consequence: medium; human confirmation required: false.
- **DEC-003:** Do not promise a fixed EMQ score. Class: `AUTO_DECIDE`; status: `resolved`; basis: anonymous/consent-limited users cannot always supply matchable identifiers; success is accurate eligible coverage and an evidence-based improvement; confidence: high; consequence: low; human confirmation required: false.
- **DEC-004:** Should Renivet CAPI logs retain raw supplied customer/request data? Class: `HUMAN_CONFIRMATION`; status: `resolved`; recommendation: Yes, retain raw profile, address, IP, browser, and click values in Renivet logs behind the existing authorized dashboard/export boundary; Meta outbound hashing remains separate; never log provider credentials; basis: explicit stakeholder approval for Point 1; confidence: high; consequence: high; human confirmation required: false.
- **DEC-005:** Define stable event-ID ownership and retry behavior. Class: `RECOMMEND_CONTINUE`; status: `resolved`; recommendation: request/action-scoped IDs for upper-funnel events and a deterministic completed-order ID for Purchase; reuse IDs across Pixel/CAPI and same-order retries, count unique IDs operationally, and stop if no canonical order identity exists; confidence: medium; consequence: high; human confirmation required: false.
- **DEC-006:** Define legacy CAPI-log handling. Class: `HUMAN_CONFIRMATION`; status: resolved; recommendation: do not rewrite historical rows and continue showing raw values to authorized operators, consistent with the approved Point 1 logging decision; basis: explicit stakeholder approval for Point 1; confidence: high; consequence: high; human confirmation required: false.

## Dependencies and exclusions

Dependencies:

- **DEP-001:** REN-145 corrected full-order Purchase payload and semantics.
- **DEP-002:** Shared `src/actions/analytics.ts`, `src/lib/fb-capi.ts`, product ViewContent path, cart hook, and both checkout implementations.
- **DEP-003:** Existing `_fbp`/`_fbc` cookie capture, Pixel loader, consent behavior, and Meta SDK sanitizer/hash contract.
- **DEP-004:** Existing `capi_logs` schema, dashboard, CSV export, and authorization procedure.
- **DEP-005:** Meta Events Manager Test Events and Search Console/URL Inspection access for external validation.

Excluded areas:

- Historical Meta event correction: Meta does not provide retroactive correction through this engineering change.
- SEO redesign, robots policy, product metadata, sitemap, and page-content changes: explicitly prohibited by this contract.
- Meta token rotation/environment hardening: owned by REN-92/REN-116.
- CAPI timeout/connection-pool architecture: owned by REN-138/REN-139 unless a direct dependency is discovered.
- General analytics redesign, new attribution model, queue/worker system, automatic retry, and database migration: no evidence requires them for this issue.
- Legal/compliance interpretation: privacy-safe implementation is required, but legal policy decisions remain with the owner.

## Test expectations

- **TEXP-001** (`unit`, REQUIRED): known crawler signatures suppress analytics; ordinary browsers and uncertain user agents remain eligible.
- **TEXP-002** (`unit`, REQUIRED): feature flag on/off behavior and privacy-safe suppression diagnostics.
- **TEXP-003** (`unit`, REQUIRED): `_fbp`, `_fbc`, and `fbclid` preservation, format validation, and no hashing/fabrication.
- **TEXP-004** (`unit`, REQUIRED): profile/address precedence, guest fallback, trusted IP-geolocation fallback, identity normalization, invalid-value omission, one-time outbound hashing, and dummy-value rejection.
- **TEXP-005** (`unit`, REQUIRED): one stable event ID across Pixel/CAPI and no duplicate emission from re-render/repeated invocation.
- **TEXP-006** (`integration`, REQUIRED): product request data and server event flow preserve normal page rendering and crawler access.
- **TEXP-007** (`integration`, REQUIRED): anonymous, authenticated, consent-limited, cookie-missing, and ad-click sessions produce correct eligible payloads.
- **TEXP-008** (`integration`, REQUIRED): single-brand and multi-brand complete orders emit one correct full-order Purchase; partial orders emit none.
- **TEXP-009** (`security`, REQUIRED): new persisted logs retain approved raw customer/request data, never provider token data, and existing dashboard authorization remains enforced.
- **TEXP-010** (`component`, REQUIRED): CAPI dashboard/export presents safe event status, suppression diagnostics, and coverage metrics without raw PII.
- **TEXP-011** (`regression`, REQUIRED): existing InitiateCheckout, AddToCart, PostHog, kill-switch, checkout, and order behavior remains unchanged.
- **TEXP-012** (`e2e`, REQUIRED): Google/Meta crawler and real-browser product-page checks confirm identical SEO-visible output and normal human telemetry.
- **TEXP-013** (`external_integration`, REQUIRED): Meta Test Events confirms identifiers, payloads, event IDs, deduplication, and Purchase values for test orders.
- **TEXP-014** (`business_uat`, REQUIRED): compare human-only baseline with Meta EMQ after 48–72 hours; report score and coverage without claiming guaranteed 10/10.

## Approval gate

This contract may become `READY_FOR_DEV` only after the independent L3 Critic reviews all required categories, findings are resolved or explicitly preserved, every requirement/scenario/invariant/flow is traceable to test expectations, governance validation passes, and no Class C decision remains unresolved.
