# Version Triggers — P08

Authoritative trigger list, reused verbatim from `16-final/RECOMMENDED_ARCHITECTURE.md` and `15-synthesis/SYNTHESIS.md` §3. **Do not invent new triggers or dates for any of these components** — the research is explicit that they are gated on named, observable events, not on a calendar.

| Component | Roadmap file | Exact trigger |
|---|---|---|
| Generalized API-First tier | `V2.md` | A second, named, API-capable brand is actually onboarding |
| Scheduled-File tier | `V2.md` | Specific brands report manual-upload cadence as active friction |
| Full reconciliation/confidence-review spine | `V2.md` | A second live source per brand is actually creating a reconciliation need |
| `brand_external_identifiers` multi-source table | `V2.md` | A brand has two concurrent live sources needing reconciliation |
| SKU-matching AI auto-apply | `V3.md` | Real match data validates thresholds, AND minimal provenance has shipped, AND `brand_external_identifiers` pin-once persistence is enforced in code |

## What is NOT gated (ships regardless of any trigger)

- The F10 access-control fix — independent of architecture, ships immediately (BRule-11).
- V1's full scope (File-First + minimal provenance + exact-match + schema/attribute AI-assist) — this is the baseline the triggers above are additions on top of, not itself gated on anything beyond normal engineering scheduling.

## Two components with zero evidenced demand today, named explicitly

Per `14-critic/ANTI_OVERENGINEERING.md`: Scheduled-File and generalized API-First currently have **no named brand** that needs either. These "should not be scheduled as work at all until a concrete trigger fires" — they are not merely lower-priority, they are not yet real work items.

## Preconditions Renivet can gather directly (not research, not engineering) that inform when these triggers might fire

- Actual brand-tier distribution across ~50 brands (informs whether API-First/Scheduled-File triggers are ever likely to fire, without itself being one of the triggers).
- Human-review staffing/ownership decision (does not gate any Phase 2 component directly, but affects whether Renivet can operationally support File-First running at the volume that might eventually surface a Scheduled-File-friction signal).

See `01-research/EVIDENCE_INDEX.md` and `99-final/OPEN_DECISIONS.md`.
