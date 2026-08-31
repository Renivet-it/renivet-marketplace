# Integrations — P08

## Unicommerce (existing, extended in V1 only for the access-control fix)

Unicommerce (Uniware) is a real, large, publicly-documented Indian OMS/WMS. Renivet's existing OAuth2 password-grant, per-tenant, pull-based integration pattern is verified correct against Unicommerce's own documented partner-integration model — not a hack. (Research: `02-unicommerce/`.)

**Free wins available with zero new integration work** (Phase 2 candidate, not V1): four inventory sub-fields already returned by the existing API calls and currently discarded (`pendingStockTransfer`, `vendorInventory`, `virtualInventory`, `pendingInventoryAssessment`), plus richer catalog attributes (name, dimensions, HSN/tax, category, images) already reachable via existing endpoints but unused. Not pursued in V1 because catalog/orders/returns generalization is explicitly Phase 2. (Research: F6; `02-unicommerce/CAPABILITY_MAP.md`.)

**Verification flag**: two of three preset paths in the existing "API Explorer" stopgap (Catalog, Returns tabs) don't match Unicommerce's documented paths — the Orders tab path is correct. Needs a live check before any Phase 2 work builds on the Explorer's assumptions. (Research: `02-unicommerce/`.)

## The client-side XLSX/CSV importer (existing, extended in V1)

`product-import.tsx` parses entirely client-side, which meaningfully limits server-side attack surface today (no server-side zip-bomb/macro-execution/path-traversal risk). It runs on `xlsx@0.18.5`, confirmed still current as of this package (`00-context/CURRENT_STATE.md`), which predates fixes for a disclosed prototype-pollution and a ReDoS issue in SheetJS's parser — exploitability against this specific call site is unverified but the dependency is confirmed outdated. (Research: F9, S5.)

Forward-looking guidance for any future generalized/server-side file-ingestion path (Phase 2 territory, not V1): formula-injection sanitization, zip-bomb caps, macro-file rejection, file-size/row-count caps, magic-byte (not extension-only) validation. (Research: `11-security-compliance/`.)

## No other integrations touched in V1

No SFTP, webhook, iPaaS, or GS1/GDSN integration exists or is built in V1. Each was independently evaluated and rejected-for-now:

| Mechanism | Verdict | Why |
|---|---|---|
| SFTP | DEFER | No brand confirmed to need it over cloud-storage/URL polling; would be Renivet's first inbound server |
| Webhook/event-driven | DEFER | Razorpay precedent proves Renivet can run secure inbound webhooks, but no proven brand-catalog need for sub-minute freshness, and it creates an always-on adversarial-input surface |
| Integration platform / iPaaS | REJECT (for now) | No confirmed native Unicommerce connector on evaluated platforms; Renivet would still build the hard integration work itself, inside a costlier, lock-in-prone tool |
| Standards-based (GS1/GDSN) | REJECT (for now) | GDSN targets large standards-compliant CPG manufacturers; Renivet's brand floor is spreadsheet-only sellers — adopting it would raise the onboarding bar, not lower it |

(Research: `03-alternative-architectures/`.)

## Dependency to resolve before the F10 fix ships

A second, legacy, global-env-var Unicommerce credential model coexists with the per-brand DB model (F8, UNKNOWN which is authoritative). This should be resolved as part of implementing the F10 fix, since the fix touches the same credential-handling surface. (Research: F8; `07-feasibility/DEPENDENCIES.md`.)
