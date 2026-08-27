# REN-169 Specification

## Goal

Remove the Node `DEP0169` warning caused by the legacy `url.parse()` call shipped in the installed `@react-pdf/image` dependency, without changing application behavior.

## Scope and design

Upgrade the React PDF dependency graph to a compatible `@react-pdf/image` release that uses the WHATWG URL API. Keep the application code unchanged. Add a deterministic regression check that scans the installed package implementation for the deprecated call and retain the existing PDF/image behavior tests.

## Root cause

The installed `@react-pdf/image@3.0.4` implementation imports Node's `url` module and calls `url.parse(src)` in `getAbsoluteLocalPath`. Node 24 emits `DEP0169` when that code path executes. The application has no direct `url.parse()` usage.

## Acceptance

- The resolved dependency no longer contains a runtime `url.parse()` call.
- Existing React PDF document/image behavior remains unchanged.
- Bun tests pass, including the regression check, and the production build completes.
- The change is dependency/test scoped; no credentials, routes, database state, or external provider behavior change.

## Verification

The fix will be verified on the feature branch, then through the normal PR checks and production deployment. The warning itself is expected to disappear when the local-image path is exercised under Node 24.
