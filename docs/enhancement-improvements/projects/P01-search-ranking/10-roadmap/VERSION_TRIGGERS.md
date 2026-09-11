# Version Triggers — P01

Single-table summary of every trigger named in `V1.md`/`V2.md`/`V3.md`, so a future reader doesn't have to hunt across files.

| From → To | Trigger | Decidable now? |
|---|---|---|
| V1 → V2 (REN-167 typo tolerance) | REN-146 ships + fallback-activation data shows a meaningful typo/failed-search share | No — needs data that doesn't exist yet |
| V1 → V2 (fallback-source logging) | Not included in REN-154's initial implementation | Yes — a scoping choice at REN-154 implementation time |
| V1 → V2 (search→purchase measurement) | P06 builds a search-to-order event link | No — depends on another Epic's roadmap |
| V1 → V2 (ranking-quality experimentation) | REN-154 data shows a specific, named ranking problem | No — needs data |
| V2 → V3 (own search/ranking end-to-end) | Strategic product decision + demonstrated recurring external-dependency risk | No — requires a human decision not yet made |

No trigger in this table is a date. Per this program's roadmap discipline, "later we can add X" is not an acceptable trigger anywhere in this Epic's roadmap.
