# Business Requirements — P01

This Epic's backlog is overwhelmingly engineering-fix-shaped (see `02-business-customer/USER_STORIES.md` for why real user stories are few). The business requirements below are stated at the level a non-engineering stakeholder would recognize; each links to the engineering issue(s) that satisfy it.

| ID | Business requirement | Satisfied by | Status |
|---|---|---|---|
| BR-1 | Search must not hang indefinitely when the external search/ML dependency is slow or unresponsive. | REN-146 | Backlog |
| BR-2 | A customer searching for a known brand name should land on that brand's page, not a generic filtered list. | REN-149 | Backlog |
| BR-3 | Search should not silently drift away from what's actually in the live catalog over time without anyone noticing. | REN-148 (staged first step only — full guarantee is out of scope) | Backlog |
| BR-4 | The business must be able to measure whether search results are useful (do customers click what search returns?). | REN-154 | Backlog |
| BR-5 | Displayed "N results" counts on catalog pages should match what a customer actually sees after filters apply. | REN-155 | Backlog |
| BR-6 | Search should feel fast; unnecessary latency in the response path should be removed. | REN-151, REN-158, REN-159 | Backlog |
| BR-7 | Engineering waste (dead code, redundant calls) in the search path should not silently increase infra cost. | REN-156, REN-158 | Backlog |

## Explicitly out of scope for this Epic

- Any new ranking algorithm, ML model, or personalization logic beyond what REN-149 reconnects (see `07-feasibility/FEASIBILITY_ASSESSMENT.md`).
- Full migration off the external search index (REN-148 is staged/cheap-step-only, per the incoming evidence and confirmed unchanged by this pass).
- Typo tolerance (REN-167) — explicitly deferred, gated on data REN-146 would produce.
