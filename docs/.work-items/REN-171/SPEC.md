# REN-171 Specification

## Goal

Close the unauthenticated `/api/permission` PII disclosure by making the route derive identity from the authenticated Clerk session and return only the authorization result required by its callers.

## Evidence and scope

- `src/app/api/permission/route.ts` trusts query-string `uId`, performs no `auth()` check, loads a full user record, and returns it as `data`.
- `src/middleware.ts` explicitly bypasses `/api/permission` before authentication and calls it with `uId` derived from the current session only for authenticated page navigation.
- The Linear finding identifies this as DEF-009 and requires 401 for unauthenticated access and no cross-user PII disclosure.
- Scope is route authorization, identity binding, response minimization, and regression coverage. No schema, migration, user data, or unrelated permission policy changes are required.

## Requirements

- Reject requests without an authenticated Clerk session with HTTP 401 before reading a user selected by the caller.
- Derive the effective user ID from `auth().userId`; query-string `uId` must never determine identity.
- Preserve the existing permission verdict behavior for authenticated middleware callers, including dashboard permission evaluation and newly-created local profiles.
- Return only a boolean authorization verdict and safe status message; do not return the full user record, roles, brand, addresses, email, phone, or other PII.
- Keep rendering and middleware failure behavior safe when Clerk, cache, or database dependencies fail.

## Approved implementation boundary

The route should authenticate directly because middleware intentionally bypasses `/api/permission`. The query parameter may be ignored or rejected for compatibility, but it must not be used as the authenticated identity. The middleware caller must be updated if necessary to consume the minimized response without changing its authorization decisions.

## Acceptance criteria

- Unauthenticated `GET /api/permission?...` returns 401 and contains no user data.
- Authenticated user A cannot obtain user B’s record by supplying B’s ID; the response contains no B PII and the effective authorization check is for A.
- Authenticated middleware permission checks continue to redirect/allow the same way for existing users.
- New-user fallback remains scoped to the authenticated Clerk user only.
- Tests cover unauthenticated, authenticated same-user/ignored-query identity, cross-user attempt, forbidden route, and safe minimized response behavior.

