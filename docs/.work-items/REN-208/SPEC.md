# REN-208 — Admin Contract Management & Brand Agreement Repository

Status: `BLOCKED` pending an approved private document-storage/access decision.

## Scope and risk

REN-208 creates an additive, brand-scoped agreement repository for Renivet Admin and read-only agreement access for the owning brand. It must not infer commercial terms, modify existing brand contract timestamps, or populate historical agreement records.

Risk is `L3`: the feature stores commercially sensitive documents, introduces a new authorization boundary, affects brand tenant isolation, and requires secure file delivery and auditability.

## Repository evidence

- `src/lib/db/schema/brand.ts` contains `brands.contract_signed_at` and `contract_expires_at`; both must remain untouched.
- `src/lib/trpc/trpc.ts` provides `adminProcedure`, `brandProcedure`, and permission middleware, but brand routes must still compare the requested `brandId` to the authenticated brand context to prevent IDOR.
- `src/lib/trpc/routes/brands/media.ts` demonstrates brand scoping, but its media model is not an agreement repository and cannot be reused as a write path without separate permissions.
- `src/lib/finance/audit.ts` and `src/lib/db/queries/audit-log.ts` provide append-only audit logging; the existing generic `attachment_url` field is not an agreement store.
- `src/app/api/uploadthing/core.ts` returns UploadThing `file.url` values for existing uploaders. Those URLs are not sufficient evidence of private, request-authorized agreement delivery.
- Existing admin brand surfaces live under `src/app/(protected)/dashboard/general/brands/`.

## Requirements

- **REQ-208-001:** Admin can create an agreement version for a selected brand with signed date, effective date, expiry date, status, version, private storage reference, and original filename recorded.
- **REQ-208-002:** Agreement versions are append-only. Replacing an agreement creates a new version and never overwrites or deletes a prior version through the normal UI.
- **REQ-208-003:** Admin can list, view, and download agreement versions for any brand they are authorized to administer.
- **REQ-208-004:** A brand user can list, view, and download only agreement versions mapped to their own brand; brand users cannot upload, edit metadata, replace, or delete.
- **REQ-208-005:** Every read and write route performs server-side authorization using the requested agreement's persisted `brandId`; hidden UI is not an authorization control.
- **REQ-208-006:** Agreement files are private at the storage layer and are delivered only through a short-lived authorized response or server-mediated stream. No permanent public URL, guessable key, or direct unprotected provider URL may be stored or returned.
- **REQ-208-007:** Upload, replacement, metadata edit, and download actions write append-only audit events containing actor, brand, agreement version, action, timestamp, and safe file metadata without file contents or secrets.
- **REQ-208-008:** Brand-to-agreement-version-to-effective-date mapping is queryable so a future commercial-terms record can cite a specific version.
- **REQ-208-009:** Absence of an uploaded agreement is displayed as `Not on file`; it must never be represented as proof that no agreement exists.
- **REQ-208-010:** No existing brand row, `contract_signed_at`, `contract_expires_at`, `brand_confidentials.has_accepted_terms`, or commercial-rate field is populated, corrected, or inferred.
- **REQ-208-011:** Failed uploads and failed metadata writes do not leave a database row pointing to a missing object or an orphaned stored file without a recoverable cleanup path.

## Scenarios

- **SCN-208-001:** Admin uploads a valid agreement and metadata; one version, one private object reference, and audit evidence are committed.
- **SCN-208-002:** Invalid dates, missing brand, unsupported type, excessive size, and invalid status/version input are rejected without a persisted partial record.
- **SCN-208-003:** Replacing an agreement creates version 2 while version 1 remains downloadable and unchanged.
- **SCN-208-004:** Admin can download any authorized brand agreement through the protected delivery path.
- **SCN-208-005:** A brand owner/member can download its own agreement but cannot upload, edit, replace, delete, or access another brand's agreement by ID.
- **SCN-208-006:** Unauthenticated access and direct provider/file-key access are denied or unusable without an authorized short-lived delivery grant.
- **SCN-208-007:** Upload, replacement, metadata edit, and download each produce the required append-only audit record.
- **SCN-208-008:** A failed object upload or database write leaves no active broken mapping and follows the cleanup/retry procedure.
- **SCN-208-009:** Existing brand data and commercial configuration remain unchanged; an empty repository reports `Not on file`.

## Invariants

- **INV-208-001:** Every active agreement version references exactly one existing brand and one private storage object.
- **INV-208-002:** Agreement versions are immutable after creation; replacement is append-only.
- **INV-208-003:** Every agreement read and mutation is authorized against the persisted agreement brand, never only a caller-supplied brand ID.
- **INV-208-004:** A brand user can never read another brand's metadata or file through ID, key, URL, or route manipulation.
- **INV-208-005:** Stored agreement references are not public URLs and are not sufficient by themselves to retrieve the file.
- **INV-208-006:** Audit records are append-only and cannot be bypassed by alternate upload, metadata, replacement, or download paths.
- **INV-208-007:** Existing brand contract timestamps, terms acceptance, and commercial values remain unchanged.

## Architecture and flow

- **FLOW-208-001:** Authorized admin selects brand -> server validates metadata -> private object upload is completed -> agreement version is inserted transactionally -> audit event is appended.
- **FLOW-208-002:** Authorized admin replacement -> new private object -> next version allocated under transaction/unique guard -> prior versions remain readable -> replacement audit event appended.
- **FLOW-208-003:** Read/download -> authenticate -> load agreement by ID -> authorize against persisted brand membership/admin rights -> issue short-lived delivery or stream -> append download audit event.
- **FLOW-208-004:** Failure -> remove newly uploaded object when the database write fails, or mark a recoverable pending state with bounded cleanup; never expose a broken active version.

The schema should use a new additive agreement-version table and a private object reference (`storageKey`/provider object ID), not a public URL. The exact provider and delivery mechanism are blocked by DEC-208-001 below.

## Decisions and blockers

- **DEC-208-001 (HUMAN_CONFIRMATION, unresolved):** Select the private storage/delivery mechanism. Current UploadThing routes return public `file.url` values and do not establish the required private-object guarantee. Options are: (a) an already-approved private object-storage provider with server-side signed delivery, or (b) a separately approved encrypted/server-managed storage implementation. Do not proceed using a public UploadThing URL or a proxy that leaves the provider URL publicly retrievable.
- **DEC-208-002 (AUTO_DECIDE):** Use append-only agreement versions with a unique `(brand_id, version)` constraint and no destructive replacement operation, consistent with the issue.
- **DEC-208-003 (AUTO_DECIDE):** Keep agreement metadata and file references in a dedicated additive table; do not overload `brands`, `brand_confidentials`, or generic audit attachment fields.
- **DEC-208-004 (AUTO_DECIDE):** Use existing server authorization middleware plus an explicit persisted-brand check on every agreement query and file route.

REN-208 is blocked until DEC-208-001 is confirmed. The remaining design is ready to implement once the storage contract is approved.

## Dependencies and boundaries

- **DEP-208-001:** Existing `brands`, `brandMembers`, users, and role/permission data.
- **DEP-208-002:** Existing admin and brand authorization middleware.
- **DEP-208-003:** Private storage provider and server-side short-lived delivery capability — unresolved.
- **DEP-208-004:** Existing append-only audit log.
- **DEP-208-005:** REN-209 commercial configuration, which will cite a specific agreement version but must not be implemented here.

Excluded: migration/backfill of existing brands, correction of contract timestamps, commercial-term extraction, brand uploads, public document URLs, Corporate Order document settings, and any BIZ-4 conclusion.

## Security and privacy

The server must authorize every metadata and file operation. Tests must include direct IDOR attempts using another agreement ID, another brand ID, guessed storage keys, stale delivery URLs, unauthenticated requests, and a brand member from a different brand. Logs must not contain file contents, signed URLs, provider secrets, or unnecessary contract text.

## Test expectations

- **TEXP-208-001:** Unit validation for dates, status, version sequencing, file type, size, and `Not on file` semantics.
- **TEXP-208-002:** Database integration for additive schema, brand FK, `(brand_id, version)` uniqueness, append-only versions, and rollback/recovery.
- **TEXP-208-003:** Admin lifecycle integration: upload -> view -> download -> replace -> retrieve both versions.
- **TEXP-208-004:** Authorization matrix: admin full access; owning brand read-only; other-brand user denied; unauthenticated denied.
- **TEXP-208-005:** Direct IDOR/security tests for agreement IDs, brand IDs, storage keys, provider URLs, expired delivery grants, and alternate routes.
- **TEXP-208-006:** Audit integration verifies upload, replacement, metadata edit, and download events with actor/brand/version and no secrets.
- **TEXP-208-007:** Failure tests verify cleanup/no orphan behavior for storage failure, database failure, duplicate version race, and download audit failure policy.
- **TEXP-208-008:** Regression verifies existing brand surfaces and all existing contract fields remain unchanged.

## Definition of done

Implementation may begin only after the private-storage decision is approved. It is complete when the additive repository, admin lifecycle, brand read-only access, IDOR/security tests, audit evidence, failure cleanup, and unchanged existing brand data are verified.
