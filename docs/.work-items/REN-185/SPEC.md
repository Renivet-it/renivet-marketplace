# REN-185 — Section 194-O TDS threshold correction

## Outcome

Correct the ordinary brand-payout TDS threshold only after the currently
applicable Section 194-O rule is confirmed, and audit existing financial-year
tracking rows created with the incorrect ₹30,000 default before any historical
withholding or record correction is executed.

## Evidence and current implementation

- The Income Tax Department's current Section 194-O page states that no
  deduction applies for an individual/HUF e-commerce participant when gross
  annual sales/services do not exceed ₹5,00,000 and PAN/Aadhaar is furnished:
  https://www.incometaxindia.gov.in/w/section-194-o-6
- The schema default at `src/lib/db/schema/finance-compliance.ts` is
  `3_000_000` paise.
- `src/lib/finance/payouts.ts` contains fallback/threshold-crossing values of
  `3_000_000` paise.
- `src/lib/finance/tds.ts` seeds new financial-year tracking rows with
  `3_000_000` paise, an additional call site beyond the Linear description.
- `src/lib/finance/calculations.ts` already defaults individual/HUF
  calculation input to `50_000_000` paise when no tracking override exists.

## Approved implementation contract

- Introduce one named finance-compliance threshold constant or resolver so
  schema defaults, payout fallbacks, rollover seeds, metadata, and crossing
  logic cannot diverge.
- Apply the approved threshold consistently to all ordinary brand-payout
  paths identified in the dependency trace.
- Use gross sales/services as the Section 194-O threshold base, with the
  approved ₹5,00,000 individual/HUF exemption threshold.
- Preserve explicit per-row overrides only if the approved policy permits
  them; do not silently rewrite historical rows.
- Add unit/regression coverage for below-threshold, exact-threshold, and
  above-threshold behavior plus rollover/default initialization.
- Produce a read-only audit report of current-financial-year tracking rows
  that used the old default, identifying affected brands, cycles, TDS amounts,
  and whether a correction may be required.
- Do not alter production records, issue refunds/credits, amend filings, or
  reverse withholding until a separately approved correction procedure and
  authorized actor are confirmed.

## Approval

The user confirmed the ₹5,00,000 gross-sales/services basis, read-only audit
scope, and deferral of historical corrections pending finance approval on
2026-09-10. The independent critic review is recorded in `CRITIC.md`.
