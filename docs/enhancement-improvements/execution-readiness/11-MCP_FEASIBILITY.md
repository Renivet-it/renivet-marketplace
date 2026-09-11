# Gate 21 — MCP Feasibility for P08 V1

Baseline established in `docs/enhancement-improvements/MCP_GOVERNANCE.md`: zero product MCP surface exists in Renivet today; all 5 configured MCP servers are developer/session tooling, not part of the application.

## P08 V1-specific evaluation

P08 V1's actual shape — brand-admin file upload → deterministic + AI-assisted mapping suggestion → dry-run preview → human approval → write — is a **synchronous request/response + human-in-the-loop workflow**, not a multi-step, ambiguous, tool-selection task. It is well served by a normal upload endpoint plus a UI review screen backed by tRPC procedures. There is no "an agent needs to autonomously decide which of several tools to invoke across an open-ended task" shape here, which is the actual value proposition MCP targets.

Evaluated against the named use cases:

| Use case | Better served by MCP, or by normal UI/API? | Reasoning |
|---|---|---|
| Onboarding | Normal UI/API | A guided upload wizard is simpler to build, test, and secure than an agentic interaction for a linear, well-defined flow |
| Diagnostics | Normal UI/API | A dashboard/log view suffices; no need for a conversational agent |
| Operator support | Normal UI/API | Same reasoning — this is a support-tooling problem, not an agentic-orchestration problem |
| Mapping assistance | Normal application API (calling the hosted LLM directly from a tRPC procedure) | The AI call itself doesn't need MCP as an intermediary — it's a single structured request, not a multi-tool agent session |
| Reconciliation queries | Normal UI/API | Deferred to Phase 2 regardless (the reconciliation spine itself is gated) — not a V1 question |

## Decision

**NOT APPLICABLE for P08 V1.** Revisit only if a future version adds a genuinely conversational mapping/reconciliation assistant that itself needs autonomous tool access across an open-ended task — not for the straightforward file-in/preview/approve flow V1 actually is. Introducing MCP here would be adding orchestration machinery with no current consumer, which `PORTFOLIO_ANTI_OVERENGINEERING.md` already flags as a pattern to avoid.
