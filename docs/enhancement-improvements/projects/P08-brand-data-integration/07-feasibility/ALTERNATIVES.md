# Alternatives Considered — P08

All 8 mechanisms from `03-alternative-architectures/` plus the Option comparison from `13-option-comparison/`, reproduced as the alternatives analysis this template section requires.

| Option | Mechanism | Verdict | Why |
|---|---|---|---|
| A | File Import | **BUILD (V1)** | Lowest risk/cost, closes the "zero automated ingestion" gap, fails loud not silent, serves every brand tier at brand-side cost near zero |
| B | Scheduled File | DEFER | Sequenced after File Import if ever built; main new risk is a silently-missed schedule with no one watching — a worse failure mode than a brand noticing a missed manual upload immediately. No brand has a confirmed need for it over manual upload at the same cadence today |
| C | SFTP | DEFER | No brand confirmed to need it over cloud-storage/URL polling; would be Renivet's first inbound server — new infrastructure class, not an extension |
| D | API-First (pull) | DEFER (generalized); the existing Unicommerce instance is fixed, not rebuilt | Generalizes low-novelty existing pattern but only serves brands with a usable API — most brands don't have one; no second named API-capable brand exists yet |
| D' | API-First (Renivet exposes an API for brands to push into) | REJECT (for now) | High commitment/support burden, no evidenced need |
| E | Webhook/Event-Driven | DEFER | Razorpay precedent proves Renivet can run secure inbound webhooks, but no proven brand-catalog need for sub-minute freshness; creates an always-on adversarial-input surface (a brand's misbehaving sender becomes Renivet's operational problem) |
| F | Hybrid (scoped) | **BUILD (recommended architecture)** | Best-or-tied-best on 10/14 comparison-matrix criteria; sequenced so only File-First + minimal provenance + hardened existing Unicommerce ship now, everything else gated |
| G | Integration Platform / iPaaS | REJECT (for now) | No confirmed native Unicommerce connector on evaluated platforms; Renivet would still build the hard work itself, inside a costlier, higher-lock-in tool |
| H | Standards-Based (GS1/GDSN) | REJECT (for now) | Targets large standards-compliant CPG manufacturers; Renivet's brand floor is spreadsheet-only sellers — adoption would raise, not lower, the onboarding bar |

## Why Hybrid over pure File-First-only or pure API-First-only

`14-critic/ARCHITECTURE_CRITIQUE.md` Q3 asked directly whether File-First alone could get ~80% of the value. Its answer: plausibly yes for the near-term, since "File-First is the only mechanism that works for every brand tier... closes F9 immediately," and its one weakness — near-real-time inventory freshness — is a need already met for brands sophisticated enough to be on Unicommerce. The marginal population that would need API-tier freshness *beyond* Unicommerce is not evidenced anywhere. This is why V1 in this package is File-First + hardened-existing-Unicommerce, not File-First alone with Unicommerce left as-is (the F10 fix is still required) and not a rush to generalize the API tier (no evidenced marginal population needs it yet).

## Why not skip straight to the full Hybrid spine

`14-critic/ARCHITECTURE_CRITIQUE.md` Q1 found the full "shared spine" (canonical ingest interface + provenance + validation + reconciliation + confidence-tier queues + audit trail) is functionally an in-house iPaaS built by hand — immediately after Option G (buy an iPaaS) was rejected for cost/lock-in reasons, without ever asking whether building the equivalent in-house carries comparable engineering/maintenance cost to the vendor cost avoided. This is the central reason V1 in this package builds only the minimal provenance slice of that spine, not the whole thing.

## Alternative considered and rejected within V1 scope: staging-table-only data model

See `06-data/DATA_REQUIREMENTS.md` for the full RDBMS comparison — staging-table-only and change-set/event-model alternatives were evaluated and rejected in favor of import-batch + import-record as the smallest safe V1 design.
