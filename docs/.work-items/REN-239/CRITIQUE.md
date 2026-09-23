# REN-239 Critic Review

Independent read-only review artifact. The critic identified that ID-only callers lacked an exact-key strategy, legacy-key behavior was unspecified, and invalidation failure semantics were unclear. The contract was amended to use a Postgres-authoritative brand-context lookup while preserving caller result shapes, never read/migrate legacy keys, and bound best-effort invalidation staleness by the selected 24-hour TTL; governance was revalidated.
