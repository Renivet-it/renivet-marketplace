# REN-141 Specification

## Goal

Remove the unused `puppeteer` production dependency and regenerate the repository lockfile so production installs no longer download Puppeteer’s bundled browser.

## Evidence and scope

`package.json:116` declares `puppeteer@^24.30.0`. A repository-wide search of tracked application source found no Puppeteer import, require, executable name, or dynamic usage. `package-lock.json` contains the direct dependency and its transitive browser packages. `bun.lock` is also present and must remain consistent with the package manifest according to the repository’s package-manager policy.

The change is limited to dependency metadata and lockfile regeneration. No application source, runtime route, build configuration, or browser automation behavior is to be introduced.

## Acceptance criteria

- `puppeteer` is absent from `package.json` dependencies.
- The lockfile(s) used by repository CI/builds no longer retain Puppeteer solely through this direct dependency.
- Repository-wide source search still finds no hidden static or dynamic usage requiring Puppeteer.
- `bun test` passes and `bun run build` succeeds.
- The diff contains only the dependency manifest/lockfile changes and any narrowly scoped dependency-resolution update required by the package manager.

## Verification

Inspect the resolved dependency graph after regeneration, run the source search, then run `bun test` and `bun run build`. Confirm a subsequent build’s install phase no longer downloads Puppeteer’s bundled Chromium.
