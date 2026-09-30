# REN-CT1 Specification

## What are we fixing?

Today the example screen shows a stale number. That confuses the people who read it.
We are changing the example module so it returns the documented value, and the screen then shows the right number.

## Affected surface

- src/example.ts
- src/example.test.ts

## Implementation plan

1. Change the example module to return the documented value.
2. Add a unit test for the value.

## Acceptance criteria

- Given a caller, when it asks for the value, then it receives the documented value.

## Rollback

Revert the change; no data is affected.

## Conditions

- COND-1: Confirm the documented value with the product owner before release (owner: product; verify: written confirmation).
