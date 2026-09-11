# Security — P01

## PII / financial data: CONFIRMED not present in this Epic's scope

`getProducts()`, `search-engine.ts`, and the schema tables they touch (`searchAnalytics`, `searchIntents`, `brandAliases`, product/brand embeddings) carry no payment, address, or government-ID data. `searchAnalytics` carries optional `sessionId`/`userId` foreign keys — these are identifiers, not PII payloads themselves, but do let a search history be reconstructed per user if joined elsewhere. **INFERRED, not exhaustively verified**: whether `userId`/`sessionId` linkage in `searchAnalytics` is covered by Renivet's general privacy/data-retention policy is UNKNOWN — no such policy document was found in this pass; flagging as a note, not a finding requiring action in this Epic.

## Tenant/brand isolation: no cross-tenant leak found in search itself

CONFIRMED: `getProducts()`'s filters do not scope by "which brand's dashboard is asking" — it's a customer-facing catalog query, not a brand-admin query, so the usual cross-tenant question (can Brand A see Brand B's private data through search?) doesn't apply the way it would to an admin endpoint. Product visibility is governed by `isActive`/`isPublished`/`isDeleted`/`verificationStatus` flags applied uniformly, not per-viewer brand identity. No evidence found of a search path that could leak one brand's unpublished/private product data to a shopper browsing another context.

**Distinguish this from the known unrelated finding**: `../../02-epics/EPIC_MAP.md` and `AUDIT_TO_BACKLOG_TRACEABILITY.md` document a real, HIGH-severity cross-tenant access-control gap in the *Unicommerce integration* under P08 — that is a different system (brand-data ingestion, not customer search) and is out of this Epic's scope; not re-investigated here.

## Transport security gap (folds into REN-146)

CONFIRMED: all 5 external-microservice call sites use plain HTTP to a bare IP literal (`http://64.227.137.174:8000`), not TLS. This means query text (potentially revealing what customers search for) travels unencrypted between Renivet's servers and the external microservice. This is a real, if modest, confidentiality gap — search query text is not typically sensitive, but "not typically" is not "never" (a customer searching a personal/medical/financial product category is a plausible counter-example). Recommend REN-146's endpoint-configuration fix include moving to HTTPS if the external service supports it — **DECISION REQUIRED**: whether the external microservice operator supports TLS at all (UNKNOWN, not verified in this documentation-only pass — no network calls were made to test).

## No auth token found on external calls

CONFIRMED absence of any API key/bearer token/shared secret in any of the 5 call sites. **UNKNOWN** whether the external service is meant to be reachable only via network-level restriction (e.g. VPC/firewall) rather than application-level auth — plausible but not verified. Not a new finding introduced by this Epic; flagged for awareness since REN-146 touches this exact code.

## Injection risk: none found

CONFIRMED — all ILIKE patterns and dynamic SQL fragments in `getProducts()` use Drizzle's parameterized `sql` template tag or `ilike()`/`inArray()` helpers, not raw string concatenation of user input. The one raw `sql.raw()` usage (`priorityProductIds` CASE statement, `product.ts` ~L1450) concatenates IDs directly into SQL text — **worth flagging**: if `priorityProductIds` can ever originate from user-controllable input (UNKNOWN, not traced — see `05-algorithms/CURRENT_ALGORITHM.md`'s note on this being an untraced P01/P02 seam), this would be a SQL-injection-shaped risk. This Epic does not change this code path, but recommends whoever eventually implements REN-151 (which touches nearby code) confirm `priorityProductIds`'s provenance is always server-controlled, not raw user input, while already in that area of the file.
