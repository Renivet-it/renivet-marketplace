# Renivet — Short Claude Controller Prompt

Read first:
- docs/enhancement-improvements/PROGRAM_CONTEXT.md
- docs/enhancement-improvements/PROGRAM_STATE.md
- docs/enhancement-improvements/EXECUTION_QUEUE.md
- docs/enhancement-improvements/DECISION_LOG.md

Then perform ONE controlled iteration.

1. Freshly verify only the relevant state against `origin/master` and live Linear.
2. Do not trust stale local state or old summaries.
3. Pick the highest-priority executable queue item.
4. Perform only the next authorized action for that item.
5. Respect SPEC → REVIEW → TEST.
6. Never create a duplicate issue.
7. Never invent evidence or lost decisions.
8. If a human/business decision is required, stop at that decision and document it.
9. If two actions are explicitly independent and already authorized, they may run in parallel.
10. Verify the result.
11. Update PROGRAM_STATE.md and EXECUTION_QUEUE.md.
12. Record durable decisions in DECISION_LOG.md.
13. STOP.

Safety:
- Do not edit application code unless the selected queue item explicitly authorizes the implementation phase.
- Do not change Vercel, DB, Redis, env, or infrastructure without explicit task scope.
- Do not push/merge unless the task explicitly authorizes it.
- Remote Git + live Linear outrank local working-tree state.
- Linear "Done" is not equivalent to verified production closure.

Final response:
- What was freshly verified
- One action taken
- Result
- Blockers
- Next queue item
