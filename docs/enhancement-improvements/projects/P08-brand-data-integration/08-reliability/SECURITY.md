# Security — P08

## The headline finding: F10, CONFIRMED, HIGH severity, still unfixed

Direct code trace (re-verified by this package 2026-08-30 against `src/lib/trpc/routes/brands/brands.ts:187-650`) confirms all 6 Unicommerce brand-settings tRPC procedures — `getUnicommerceIntegration`, `upsertUnicommerceIntegration`, `authenticateUnicommerceIntegration`, `runUnicommerceApiRequest`, `testUnicommerceIntegration`, `triggerUnicommerceSync` — gate only on `isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand")`, a permission-bitfield check with **no brand identity encoded**. The `brandId` actually used in every DB read/write is the client-supplied `input.brandId`, never cross-checked against the caller's own `ctx.user.brand.id`.

**Practical impact**: any authenticated brand-ADMINISTRATOR can read, overwrite, or trigger a sync against **any other brand's** Unicommerce integration. `runUnicommerceApiRequest` is the worst sub-case — a full read/write proxy into a stranger's live Unicommerce tenant using that brand's real credentials, server-side, with no path/method allowlist (compounding finding S3).

**The fix exists elsewhere in the same codebase** — `brand-product-type-packing.tsx:27-38` correctly derives the brand id from `ctx.user.brand.id` server-side rather than trusting client input. The fix is one ownership check per procedure (`if (input.brandId !== ctx.user.brand?.id) throw FORBIDDEN`), or a shared middleware — low engineering cost, independent of any architecture decision in this Epic.

**Classification: CONFIRMED.** (Research: F10; `11-security-compliance/` S1.)

## Cross-reference: DEF-010, likely the same defect class, INFERRED not proven identical

The portfolio's own security audit independently found **DEF-010**: a cross-tenant authorization bypass across 51 of 104 brand-router tRPC procedures generally, including a full privilege-escalation chain (a Brand-A admin can grant themselves admin on Brand B via `roles.ts`/`members.ts`). Neither research program cross-referenced the other while finding it — they arrived at the same root cause (missing ownership check, client-supplied `brandId` trusted directly) from different directions: P08's research read `brands.ts` specifically for its Unicommerce architecture question; the portfolio's security wave audited brand-router procedures broadly.

**Recommendation, preserved from the portfolio risk register: treat DEF-010 as the authoritative, broader finding and F10 as corroborating evidence of one concrete instance, not two separate defects.** A single fix pattern (per-procedure ownership check, already correct elsewhere in the codebase) likely closes both. **Classification: the identity between F10 and (part of) DEF-010 is INFERRED — likely, not proven identical.** (Portfolio: `08-risks/PORTFOLIO_RISK_REGISTER.md`.)

DEF-010 itself is currently **UNTRACKED in Linear** per the same portfolio risk register — this compounds the traceability gap this Epic already has (see `12-traceability/AUDIT_TO_EPIC.md`).

## Exhaustive tenant-isolation walk for this Epic's new surface area

The parent task requires this section to cover brand-to-brand isolation exhaustively across every new surface this Epic introduces, not just the pre-existing F10 gap:

| Surface | Isolation requirement | V1 status |
|---|---|---|
| Imports (batch upload) | A brand can only create/view/approve/cancel its own `import_batches`/`import_records` rows | New surface — must be built correctly from day one (NFR-1) |
| Schema mappings | A brand's confirmed column mapping is scoped to that brand only; no cross-brand mapping reuse or leakage | New surface — per-brand table design already assumed in `06-data/DATA_CONTRACTS.md` |
| Attribute lookup tables | Per-brand-scoped (corrected from an originally-proposed global table, `15-synthesis/SYNTHESIS.md` §6) — this correction is itself a tenant-isolation improvement, not just a data-quality one | New surface — corrected design already reflected in `05-algorithms/TARGET_ALGORITHM.md` |
| Inventory/price/catalog writes | Existing `brandId`-scoped write patterns in canonical tables are reused; validation layer explicitly checks referential integrity against `brandId` (FR-12) | Reuses existing pattern, validated per-row |
| Media | `brandMediaItems` associations are already brand-scoped in the existing schema; File-First writes must not bypass this scoping | Reuses existing correct pattern |
| Credentials (Unicommerce) | **F10 — currently broken**, must be fixed independent of this Epic's other work | CONFIRMED gap, fix required (BRule-11) |
| Import/audit logs | A brand can only view its own batch/record logs — no cross-brand visibility into another brand's import history or error detail | New surface — must be built correctly from day one |

No surface in this table is exempted from tenant isolation; the exhaustiveness the parent task asked for is the point of listing every one, not just the headline F10 case.

## Other findings from the security research wave (all "RISK CONSIDERATION" classification, lower severity than F10)

- **S2**: Unicommerce credential encryption key is derived from `JWT_SECRET_KEY` — a key-reuse anti-pattern coupling JWT rotation to credential-decryption breakage.
- **S3**: the "API Explorer" has no path/method allowlist, compounding S1/F10's blast radius.
- **S4**: cron shared-secret comparison isn't constant-time (low severity, server-to-server only).
- **S5**: `product-import.tsx` runs on outdated `xlsx@0.18.5` (predates fixes for a disclosed prototype-pollution and a ReDoS issue in SheetJS's parser). Exploitability against this specific client-side call site is unverified but the dependency is confirmed outdated (re-verified unchanged, `00-context/CURRENT_STATE.md`).

## File-security guidance for V1's extended importer

Client-side-only parsing (today's model) meaningfully limits server-side attack surface. If V1's shared write path introduces any server-side file handling, apply: formula-injection sanitization, zip-bomb caps, macro-file rejection, file-size/row-count caps, and magic-byte (not extension-only) validation. (Research: `11-security-compliance/`.)

## Tenancy-model scoping note

Renivet's `user.brand` relationship is singular (one brand per user) and the warehouse model is a single address — genuinely simple tenancy. Security fixes in this Epic should not over-engineer for multi-user-per-brand permission tiers not evidenced in the schema. (Research: `11-security-compliance/`.)
