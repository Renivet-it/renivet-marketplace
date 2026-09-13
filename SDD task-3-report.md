# Task 3 Evidence — Homepage heading guard

Date: 2026-09-13

- RED: the new fixture-based guard test inserted a bare `<h1>` into each migrated homepage section in turn. Before the guard change, all six cases failed the expectation because `seo:validate-headings` exited 0 instead of rejecting the mutation.
- GREEN: the `/` composition in `scripts/seo/validate-heading-usage.ts` now explicitly includes `discount-section.tsx`, `everyday-essential.tsx`, `shop-slow.tsx`, `top-collection.tsx`, `new-collection.tsx`, and `product-new-arrival.tsx`.
- Regression coverage: `scripts/seo/validate-heading-usage.test.ts` executes the real guard against each mutation and asserts a non-zero exit; metadata/heading composition coverage includes all six current components.
- Verification: focused suite passed (21 tests); `bun run seo:validate-headings` passed; full `bun test` passed (259 pass, 1 skip, 0 fail); `bun run governance:validate -- docs/.work-items/REN-219/work-item.yaml` passed; `git diff --check` returned no errors.
