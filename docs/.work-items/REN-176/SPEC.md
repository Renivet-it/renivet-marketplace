# REN-176 Specification

## Goal

Implement an auditable corporate-order QC lifecycle: authenticated users submit evidence, an authorized reviewer records an explicit approval or rejection with reviewer identity and timestamp, and the shared REN-175 status guard permits dispatch only when an approved QC submission exists.

## Linear context

- Title: [Corporate Order] Implement real QC approval gate for corporate fulfillment
- Priority: Urgent
- Status: Backlog
- Label: Bug
- Assignee: Ayan Ganguly
- Branch context: `ayanganguly333/ren-176-corporate-order-implement-real-qc-approval-gate-for`
- Relation: REN-175 shared status-transition guard

## Evidence and current behavior

`corporatePlatform.submitQc` currently inserts a `corporateQcSubmissions` row with status `submitted`, stores QC images/documents, and emits an event. Its router is only `protectedProcedure`, without site-permission middleware. It does not verify order ownership/assignment or order state. There is no review/approve/reject procedure and no service currently changes the QC status after submission.

The existing schema already contains QC status values `pending`, `submitted`, `approved`, and `rejected`, reviewer identity, and reviewed date fields, plus related image/document tables. The corporate order status schema contains `quality_check` and `ready_for_dispatch`; the REN-175 shared `updateStatus` guard currently handles dispatch preconditions and is the integration point for the approved-QC predicate.

## Design

Keep submission and review as separate procedures. Protect submission and review with the existing corporate order-management permission middleware. On submit, validate the order exists, is a corporate order in a QC-eligible state, and persist the submitting actor, evidence, coverage, remarks, and submission date. On review, load the submission and order, require an authorized reviewer, persist `approved` or `rejected`, reviewer identity, review timestamp, and optional notes, and emit an immutable audit event. Prevent review of a missing or already-finalized submission unless an explicit revision policy is approved.

Add a query/service predicate that returns true only for an explicit `approved` submission for the order. Wire that predicate into the shared REN-175 transition guard before `ready_for_dispatch`, `dispatched`, or `delivered` transitions as applicable, without duplicating the check in shipment, Delhivery, or brand endpoints. Preserve all existing fulfillment, delivery-mode, e-way-bill, authorization, and warehouse fail-closed controls.

Expose review through the corporate admin UI using the existing order-management surface. Show evidence, coverage, remarks, submission actor/date, review decision, reviewer/date, and review notes. No QC PDF/export is included in this issue; the required audit trail is queryable from the order detail/API.

Implementation must add the review-notes field and any required timestamp precision through an additive migration, with an explicit policy for legacy pending/submitted rows and any existing approved rows. Submission and review writes must be transactional (or have deterministic compensating rollback), and review events must use an idempotency key or equivalent uniqueness strategy. Multiple submissions require an explicit active/latest-version rule so an older approval cannot satisfy dispatch after a newer submission; rejected submissions may be resubmitted only under that defined rule. The service must enforce a role/order/brand authorization matrix and validate or authorize evidence URLs on both write and read paths.

## Security and consistency

Every QC mutation is authenticated and requires `BitFieldSitePermission.MANAGE_ORDERS`. The service repeats order and submission authorization checks so callers cannot submit/review another tenant's order through a crafted request. Review writes must be conditional on the current submission status to prevent competing reviewers from both finalizing the same submission. Approval must be idempotent for safe retries and must not create duplicate review events. Rejected or pending QC never satisfies the dispatch gate.

## Out of scope

AQL/statistical sampling policy, non-corporate marketplace QC, warehouse GRN implementation (REN-183), e-way-bill generation, and a QC PDF/export format.

## Decision

The reviewer may be the same person as the submitter or a different person. In both cases, the reviewer must be authenticated, authorized, and recorded on the review.

Owner-approved data rules: add a `reviewNotes` field, store `reviewedAt` as a full timestamp, treat legacy rows without explicit `approved` status as non-approved, use only the latest active submission for dispatch eligibility, and roll back partial submission/review writes.

## Verification

Add API/service tests for submit authorization, review authorization, missing/pending/submitted/rejected/approved QC states, reviewer identity and timestamps, duplicate/concurrent review behavior, and shared-guard dispatch outcomes. Add component coverage for the admin review surface and full Bun/governance verification.
