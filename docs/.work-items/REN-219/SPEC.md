# REN-219 — Shared H1 and canonical framework

Introduce one shared heading mechanism and migrate the six homepage section H1 usages to non-root headings. Add clean canonicals to shop, product, and blog templates; shop filtered/sorted/paginated variants must canonicalize to the clean base URL. Coordinate with REN-216 and preserve existing working canonicals.

Validation requires H1 counts, canonical checks across query variants, regression checks for existing canonical templates, and a guard against reintroducing bare section H1s.
