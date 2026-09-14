# Task 2 Evidence — Organization social profiles

Date: 2026-09-13

- RED: `bun test src/lib/seo/structured-data.test.ts scripts/seo/validate-heading-usage.test.ts tests/seo-metadata-headings.test.ts` failed because `buildSiteIdentityJsonLd()` omitted the expected `Organization.sameAs` array.
- GREEN: added `siteSocialProfileUrls`, derived only from the HTTPS values in the existing `siteConfig.footer` Socials menu, and passed it through `RootLayout` to `buildSiteIdentityJsonLd()`.
- Regression coverage: the structured-data test asserts the three configured Instagram, LinkedIn, and YouTube profiles in `sameAs`, excludes placeholders, and confirms `SearchAction` remains absent.
- Verification: focused suite passed (21 tests); full `bun test` passed (259 pass, 1 skip, 0 fail); `bun run governance:validate -- docs/.work-items/REN-220/work-item.yaml` passed; `git diff --check` returned no errors.
