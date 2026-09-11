# Audit → Backlog Traceability

Every meaningful audit/QC finding from this pass's three inventories, traced: **Audit finding → QC disposition → Epic → Engineering issue → Verification → Final status.** Sources: `docs/audits/ecommerce-intelligence/` (search/recommendations/checkout/tracking), root `AUDIT.md` (security), `docs/infrastructure-audits/2026-08-25/` (Vercel/staging), `qa/` (production-safety, `DEF-*` IDs). No duplicates created — where one finding already has a Linear issue, this document points to it rather than re-describing it.

## Source 1 — ecommerce-intelligence audit (search / recommendations / checkout / tracking)

| Finding ID | Domain | QC disposition | Epic | Linear issue | Verification | Final status |
|---|---|---|---|---|---|---|
| CJ-F004 | Payment/order integrity | KEEP WITH CONDITIONS — QC found broader (per-item, not per-brand) + new orphaned-pending-row mode | EPIC-P05-001 | REN-144 | Not yet | Backlog, P0 |
| AN-F001 | Analytics/Ads | KEEP; historical framing downgraded CONFIRMED→PROBABLE | EPIC-P06-001 | REN-145 (bundles QC-discovered per-brand-fanout too) | Not yet | Backlog, P0 |
| M-01/M-02 | External ML dependency | KEEP, bundled | EPIC-P01-001 | REN-146 | Not yet | Backlog, P1 |
| M-03 | External search index drift | KEEP, staged | EPIC-P01-001 | REN-148 | Not yet | Backlog, P1 — full migration explicitly out of scope |
| RE-F002 | Recommendation fallback | KEEP | EPIC-P02-001 | REN-147 | Not yet | Backlog, P1 |
| SE-F009 | Search typo tolerance | DEFERRED — gated on REN-146 data | EPIC-P01-001 | REN-167 | N/A until gate | Deferred |
| SE-F003 | Search intent redirect | KEEP, one-line fix | EPIC-P01-001 | REN-149 | Not yet | Backlog, P1 |
| SE-F002 | Sort-by-price override | **RESOLVED pre-audit** (commit `8b302953`) | EPIC-P01-001 | No ticket needed | Recommend regression test only | Resolved |
| SE-F004 | requireMedia post-pagination | KEEP | EPIC-P01-001 (thin overlap: P03) | REN-155 | Not yet | Backlog, P2 |
| SE-F006 | Dead code / redundant RAG calls | KEEP | EPIC-P01-001 | REN-156 | Not yet | Backlog, P2 |
| SE-F008 | Unused `getSuggestions` generator | Bundled | XC-DEBT-001 | REN-107 | Not yet | Backlog, P3 |
| PF-F001 | Sequential external calls in `getProducts()` | KEEP, confirmed non-overlap w/ REN-83 | EPIC-P01-001 | REN-151 | Not yet | Backlog, P1 |
| PF-F004 | ILIKE fallback runs redundantly | KEEP | EPIC-P01-001 | REN-158 | Not yet | Backlog, P2 |
| PF-F005 | Catalog listings never cached | KEEP, confirmed non-overlap w/ REN-139/140 | EPIC-P01-001 | REN-159 | Not yet | Backlog, P2 |
| AN-F002 | Search click/result-count logging is a no-op stub | KEEP | EPIC-P01-001 | REN-154 | Not yet | Backlog, P1 |
| RE-F004 | Shop-page sort collapses rank | KEEP | EPIC-P02-001 | REN-150 | Not yet | Backlog, P1 |
| RE-F006 (copy half) | Misleading recommendation copy | KEEP, ships now | EPIC-P02-001 | REN-157 | Not yet | Backlog, P2 |
| RE-F006 (signal half) | No real co-occurrence signal | DEFERRED — gated on business need | EPIC-P02-001 | REN-168 | N/A until gate | Deferred |
| PF-F006 | Recommendation computation never cached | KEEP | EPIC-P02-001 | REN-160 | Not yet | Backlog, P2 |
| RE-F005 | Docstring drift | Bundled | XC-DEBT-001 | REN-107 | Not yet | Backlog, P3 |
| RE-F007 | No post-purchase recommendation surface | VERIFICATION — PROBABLE confidence only | EPIC-P02-001 | REN-165 | Not yet | Verification-only |
| RE-F008 | Recently-viewed browser-local only | NO-ACTION — no demonstrated harm | — | Not tracked | N/A | Closed, no action |
| CJ-F001 | Duplicate checkout implementations + data-loss bug | KEEP, strengthened by QC | EPIC-P05-001 | REN-152 | Not yet | Backlog, P1 |
| CJ-F003 | TRYNEW20 no disclosure | KEEP | EPIC-P05-001 | REN-161 | Not yet | Backlog, P2 |
| CJ-F005 | Out-of-stock cart items shown available | KEEP | EPIC-P05-001 | REN-153 | Not yet | Backlog, P1 |
| CJ-F006 | Payment-cancel always → /mycart | KEEP | EPIC-P05-001 | REN-163 | Not yet | Backlog, P3 |
| CJ-F002 | Dead `/profile/cart` route | Bundled | XC-DEBT-001 | REN-107 | Not yet | Backlog, P3 |
| CJ-F007 | Dead guest-checkout design file | NO-ACTION, cross-referenced | XC-DEBT-001 | REN-107 | Not yet | Backlog, P3 |
| AN-F003 | PostHog init delayed 5s | Pre-existing exact match | EPIC-P06-001 | REN-129 (shipped) / REN-164 (verification cross-ref) | REN-129 shipped; REN-164 needs live browser check | Mostly resolved, one open verification |
| AN-F004 | GA4 pageviews-only | DEFERRED — gated on product decision | EPIC-P06-001 | REN-166 | N/A until decision | Deferred |
| AN-F005 | PostHog never called identify() | **RESOLVED**, shipped | EPIC-P06-001 | REN-128 (Deployed to Prod) | Confirmed deployed | Resolved |
| AN-F006 | Click-tracking only 2 surfaces | KEEP, scope narrowed by QC | EPIC-P06-001 | REN-162 | Not yet | Backlog, P2 |

## Source 2 — root `AUDIT.md` (security, predates ecommerce-intelligence pass)

| Linear | Finding | Epic/stream | Status per AUDIT.md | Verification |
|---|---|---|---|---|
| REN-92 | Hardcoded Meta CAPI token | XC-SEC-001 | Confirmed RESOLVED (rotated + env, companion REN-116) | Deployed to Prod |
| REN-93 | Unauthenticated finance export endpoints | XC-SEC-001 | Critical #1 | Deployed to Prod — **recommend confirming the fix actually closed the gap**, see risk register |
| REN-94 | Unauthenticated Delhivery/Shiprocket routes | XC-SEC-001 | Critical #2 | Deployed to Prod — same verification note |
| REN-95 | Checkout login wall (3-layer) | XC-SEC-001 / EPIC-P05-001 | Critical #3, open | Not yet — pilot subject of the SPEC governance tooling, `BLOCKED` pending 6 product/security/finance decisions |
| REN-96 | Clerk webhook crash, phone-only users | XC-SEC-001 | High, open | Deployed to Prod |
| REN-97 | Corporate orders via unverified email match | XC-SEC-001 | High, open, IDOR-adjacent | Deployed to Prod |
| REN-98 | Real bank account/IFSC hardcoded as schema defaults | XC-SEC-001 | High, open | Deployed to Prod |
| REN-99 | Cron endpoints missing shared-secret check | XC-SEC-001 | High #4, open | Deployed to Prod |
| REN-100 | Next.js predates CVE-2025-29927 | XC-SEC-001 | High #5, open | Deployed to Prod |
| REN-101 | Zero test coverage, payment/order path | XC-SEC-001 | High #6 — explains why REN-144 went undetected | Backlog |
| REN-102 | ~40 new `any`/`as any` in admin-finance-queue.tsx | XC-DEBT-001 | Medium | Backlog |
| REN-103 | 402 `:any` + 309 `as any` repo-wide | XC-DEBT-001 | High #7 | Backlog |
| REN-104 | No App Router error/loading boundaries | XC-SEC-001 | High #8 | Backlog |
| REN-105 | Client/Server boundary not pushed to leaves | XC-SEC-001 | High #9 | Backlog |
| REN-106 | Shiprocket webhook plain-string compare | XC-SEC-001 | Medium | Deployed to Prod |
| REN-107 | Repo hygiene bundle (+ 4 folded ecommerce-audit findings) | XC-DEBT-001 | Low | Backlog |

**Orphaned relative to both audit programs:** REN-169 (legacy `url.parse` in `@react-pdf/image`), REN-170 (governance validation checks wrong work item) — real, tracked, but sourced from a separate dependency-hygiene/governance-tooling track not covered by either audit document set.

## Source 3 — infrastructure audit (`docs/infrastructure-audits/2026-08-25/`)

| Finding | Domain | Disposition | Linear |
|---|---|---|---|
| Staging mirrors every branch (RC-1) | Vercel cost | **FIXED** — Model B/Option A shipped via REN-143 Phase B | REN-137 (superseded by REN-143) |
| `shouldRunExternalSideEffects()` fail-open default | Staging isolation | **FIXED in REN-143 design** | REN-113/114 |
| 4 hardcoded Delhivery URLs | Security | Marked Done (**REN-115**), but a **5th residual site** found by REN-143's own investigation is not yet a distinct tracked item — see risk register | REN-115 (Done, incomplete) |
| CAPI sequential unguarded calls, no timeout | Vercel reliability | Backlog, unstarted, explicitly out of scope for REN-143 | REN-138 |
| DB pool `max: 15` regression | Reliability | Backlog, unstarted — only finding with confirmed customer-facing impact | REN-139 |
| Redis client untuned | Reliability | Backlog, unstarted | REN-140 |
| Node 20.x EOL, deadline 2026-10-01 | Platform | Backlog, Urgent, unstarted, most time-sensitive item in the portfolio | REN-136 |
| Dead `puppeteer` dependency | Hygiene | Backlog | REN-141 |
| DB/Redis/Razorpay/Delhivery/Clerk staging↔prod isolation | Staging isolation | Was UNVERIFIED; resolved via developer confirmation in REN-143 DEP-002/003 | REN-117/118/119 possibly superseded — see risk register |
| Webhook/cron secret isolation | Security | Was UNVERIFIED; REN-143 DEP-004 marked resolved | Not separately tracked |
| Razorpay refund/legacy Shiprocket cancellation paths, Meta Pixel live-ID fallback, real-SMS OTP cost reachable from staging | Security scope gap | Found by REN-143's own Critic as **omitted from the original audit's scope entirely** | Orphaned until REN-143 covered it |
| `main`-branch PR-only enforcement | Governance | Never decided, flagged twice | **Orphaned** |
| `/shop` malformed-UUID input, Web Analytics disabled both projects | Various | Real, low-priority | **Orphaned** |

## Source 4 — `qa/` production-safety program (`DEF-*`)

See `08-risks/PORTFOLIO_RISK_REGISTER.md` for the full P0 gate-item table (DEF-009, DEF-010, DEF-024, DEF-003, DEF-002) — not duplicated here. DEF-024 = REN-145. The other four are the most severe untracked items in this entire reconciliation; DEF-011 through DEF-036 (P1–P3 tail) exist in `qa/FINDINGS/DEFECT_RECORDS.md` and `qa/RELEASE_RISK_REGISTER.md` but were not individually cross-referenced against Linear in this pass — flagged as a worthwhile follow-up, not claimed complete here.

## Nothing materially valid is orphaned without being named

Every finding in this document either has a Linear issue, an explicit deferred/no-action disposition with a reason, or is explicitly named as orphaned above. The one exception is the DEF-011–036 tail noted immediately above, which this pass did not have time to individually reconcile — named as a gap, not silently dropped.
