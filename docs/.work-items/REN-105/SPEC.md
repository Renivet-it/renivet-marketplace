# REN-105 Specification

## Goal

Reduce unnecessary client boundaries incrementally by removing `use client` from a small, verified set of leaf UI components that have no hooks, browser APIs, or event handlers of their own.

## Evidence and scope

- Linear reports 868/951 component TSX files currently marked `use client`.
- `src/components/ui/card.tsx`, `skeleton.tsx`, and `button-general.tsx` are already server-compatible; `separator.tsx` and `label.tsx` use Radix primitives but contain no React hooks or browser APIs. The installed versions are `@radix-ui/react-separator@1.1.2` and `@radix-ui/react-label@2.1.2` in `bun.lock`.
- Scope is an initial leaf-component pilot: remove client directives only from stateless UI leaves after consumer/build verification. Do not refactor feature subtrees or components requiring interactivity.

## Acceptance criteria

- The selected stateless leaf components no longer declare `use client`.
- Their public serializable props, rendered markup, styling, and Radix behavior remain unchanged for server consumers; full ref/event behavior remains available for client consumers, since server components cannot receive function props or refs across the boundary.
- Existing client consumers continue to import and render them through the normal server-to-client composition boundary.
- No component with hooks, browser APIs, event handlers, context, or client-only package behavior is moved in this pilot.
- `tests/ren-105-boundaries.test.ts` performs an allowlisted directive check, server/client consumer fixtures, prop/ref/ARIA regression checks, and an unchanged-candidate inventory; a production build/render check verifies the installed Radix package entries.

## Decision

Start with the conservative `separator.tsx` and `label.tsx` pilot, which are presentational wrappers around Radix primitives and have no local client-only logic. For server consumers, only serializable props are supported; client consumers retain the existing ref/handler contract. Expand only through later task-local reviews after this slice is green. The 2026-08-30 inventory command is `rg -l '^"use client"' src/components --glob '*.tsx'` (868 client-marked of 951 TSX components).
