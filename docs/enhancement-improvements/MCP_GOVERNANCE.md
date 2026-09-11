# MCP Governance

## Current state: MCP is developer/governance tooling, not application architecture

`.mcp.json` at the repo root configures 5 MCP servers: `linear`, `slack`, `meta_ads`, `meta_developer_tools` (all hosted, HTTP-based), and `ruflo` (a local claude-flow coordination server, invoked as a CLI). **All five are Claude Code session tooling** — used by engineers/agents working *on* the Renivet codebase (Linear issue management, Slack, Meta Ads/Developer Tools lookups, multi-agent coordination) — **none are part of the Renivet application's own runtime architecture.** No evidence anywhere in this reconciliation shows Renivet's product code (the Next.js app, its tRPC routes, its background jobs) invoking an MCP server at runtime.

This matters for governance: the preferred/anti-pattern distinction in the program brief (§23) is about *product* architecture risk (an LLM able to mutate a database unrestricted via MCP), and that risk does not currently exist in Renivet's product — because Renivet's product has no MCP surface at all yet.

## Principle, stated for when this changes

If Renivet's product ever gains an MCP-based interaction/orchestration layer (e.g., an AI assistant that can query or act on brand/order/inventory data), the required shape is:

```
MCP
  → application API (tRPC procedures, same auth/ownership checks as any other caller)
  → policy engine (same confidence/guardrail discipline as AI_GOVERNANCE.md)
  → deterministic core
```

Never:

```
LLM → MCP → unrestricted DB mutation
```

Concretely: an MCP tool exposed by Renivet's product must go through the same `protectedProcedure`/ownership-check pattern already required of every other caller — the same pattern whose *absence* is what caused the DEF-010/Wave-0-F10 cross-tenant access-control gap (`08-risks/PORTFOLIO_RISK_REGISTER.md`). An MCP layer built before that gap is closed would be building a new attack surface on top of an already-confirmed one.

## Recommendation

No action needed now — no Renivet product MCP surface exists to govern. Revisit this document if/when one is proposed, and gate its design on the same DEF-010 fix and AI_GOVERNANCE.md confidence-tier discipline referenced above.
