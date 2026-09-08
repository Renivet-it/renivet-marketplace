# REN-156 Specification

## Goal

Remove the confirmed-unused `src/lib/python/ai-suggestion.ts` client so the repository no longer carries a duplicate external RAG/suggestions implementation.

## Evidence and scope

- Linear REN-156 is a Medium-priority backlog task with no comments, blockers, or dependencies.
- Repository-wide search found only the declarations and self-contained references inside `src/lib/python/ai-suggestion.ts`; no application caller imports either export.
- The live search-suggestions flow uses `src/app/api/search/suggestions/route.ts`, which constructs its own upstream request and does not import this module.
- Scope is deletion of the dead module plus focused zero-reference and build/typecheck verification. Live RAG-call consolidation, REN-146 timeout/configuration work, database changes, and production configuration are excluded.

## Requirements

- Confirm immediately before deletion that no source, test, configuration, or generated-runtime reference requires the target module.
- Remove the dead module and both unused exports from application source.
- Preserve live search, typeahead, recommendation, and catalog behavior; no active caller or external API contract may change.
- Verify the resulting repository with build/typecheck checks and record unrelated pre-existing failures separately.

## Acceptance criteria

- `src/lib/python/ai-suggestion.ts` no longer exists.
- A repository-wide reference search finds no import, export, path, or runtime reference to the removed module or its dead exports.
- The live search-suggestions route and other active ML/RAG consumers remain unchanged.
- Verification introduces no failure caused by the deletion.

## Approved scope policy

This is a deletion-only cleanup. Do not fold REN-146 timeout/configuration work or live RAG-call consolidation into this task.

