# Experiment Strategy — P01

## No experimentation is proposed for this Epic

All nine active issues are correctness/reliability/efficiency fixes with a clear right answer (a timeout should exist; a computed redirect should be used; a count should match its data) — none is a hypothesis about customer behavior that would benefit from an A/B test. Running an experiment on "should search have a timeout" would be inappropriate; it is not a product hypothesis, it is a defect.

## Where experimentation *would* become relevant (not this Epic)

If, after REN-154 ships and data accumulates, a future initiative proposes a ranking-quality change (e.g. tuning the brand-match threshold, testing a different RAG `limit` parameter, or evaluating REN-167's typo tolerance), that work would warrant a proper A/B or interleaving experiment — see `10-roadmap/V2.md`'s triggers. This Epic explicitly does not reach that point; it only builds the measurement prerequisite (REN-154).

## Dependency

Per `08-reliability/OBSERVABILITY.md` and P06's Epic (Measurement & Experimentation, per `../../02-epics/EPIC_MAP.md`), any future search experimentation should route through whatever experimentation infrastructure P06 governs, rather than this Epic inventing its own. **UNKNOWN** whether P06 currently has a general-purpose A/B testing capability — not verified in this pass, out of scope.
