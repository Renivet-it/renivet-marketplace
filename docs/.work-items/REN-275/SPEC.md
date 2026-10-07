# REN-275 Specification

Define and enforce Corporate field-level visibility for buyer, brand, and Renivet/admin roles; replace guessable employee identifiers with opaque values where identity linkage is needed; and make payment, order, QC, documents, settlement, and shipping failures explicit, observable, retryable or compensating.

Acceptance: brands cannot reconstruct employee identities or access non-required fields; every side-effect boundary ends in a valid completed or recoverable state; UI/API never reports success without required persisted records; recovery is auditable.
