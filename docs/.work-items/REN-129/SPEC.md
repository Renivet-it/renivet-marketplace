# REN-129 Specification

## Goal

Reassess the five-second delayed PostHog browser initialization and select a measured, reversible initialization policy that improves early-visit capture without materially regressing page performance.

## Evidence and scope

- `src/components/providers/client.tsx` initializes `posthog-js` after a five-second timeout.
- `PostHogPageView` and the identify bridge depend on the provider client and therefore can miss early lifecycle events.
- The issue reports mobile-heavy traffic and fast in-app-browser exits, but the original PageSpeed baseline for the delay is not present in the repository.
- Scope is initialization timing/configuration, measurement, and regression coverage. No event taxonomy, server analytics, identity model, or session-recording policy may change unless explicitly selected by the final decision.

## Acceptance criteria

- The selected initialization policy is documented with before/after performance and capture measurements.
- Early pageview and eligible funnel events are not silently lost because initialization is delayed beyond the visit lifetime.
- Session recording is not enabled earlier or more broadly than the approved policy.
- Existing PostHog host/key configuration, identity reset behavior, and event names remain compatible.
- Tests cover initialization timing, cleanup, capture availability, and failure-safe behavior.

## Decision gate

The original PageSpeed target and acceptable regression budget are unavailable. A developer must confirm the performance budget or approve a staged experiment before choosing immediate initialization versus a shorter delay.

