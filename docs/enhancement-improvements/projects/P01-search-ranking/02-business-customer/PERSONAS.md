# Personas — P01

No dedicated customer-research or persona documentation exists for Renivet search (UNKNOWN — not found anywhere in the repo). The two personas below are INFERRED from the product surface itself (a multi-brand curated marketplace with brand pages, category browsing, and a search bar), not from user research.

## Persona 1 — The intent-driven shopper
Knows roughly what they want (a brand name, a product type like "sneakers," a category like "home decor") and types it into search expecting to land close to that thing immediately. This persona is directly affected by REN-149 (brand/category intent is computed but discarded) and by REN-146/151 (any latency or hang directly frustrates a shopper who already knows what they want).

## Persona 2 — The exploratory browser
Has a vaguer idea ("something for a gift," a loosely-described item) and relies more on the semantic/RAG ranking quality and on discovery affordances (suggested categories, discount sorting) than on exact-match intent. This persona is more affected by ranking quality and result-count accuracy (REN-155) than by the intent-redirect bug.

**DECISION REQUIRED:** whether Renivet has any actual customer research (surveys, session recordings, support-ticket themes) that would validate or replace these inferred personas — none was found in this pass.
