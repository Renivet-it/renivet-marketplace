# REN-143 Phase B — Vercel Build-Trigger Optimization

## Hard entry gate

Phase B must not be implemented, configured, or opened for review until Phase A is deployed and every required live safety criterion is evidenced. It has a separate reviewer, change window, and rollback owner.

## Required behavior

| Git action | Production project | Staging project |
|---|---|---|
| Feature branch push | Preview deployment remains unchanged | No staging build for the tracked production target; measure build count/Build CPU only |
| Merge/push to `main` | Existing behavior unchanged | Production-target staging deployment at `staging.renivet.com` |
| Merge/push to `master` | Production deployment unchanged | No unnecessary staging deployment/build |

## Selected control: Option A

The owner selected the staging project's project-specific Ignored Build Step set to “Only build production”, with `main` as the tracked production branch. Acceptance measures staging build count and Build CPU; it makes no deployment-count, quota, or currency-savings claim. The control must still be demonstrated in the staging project and rolled back once before Phase B approval.

## Control-selection evidence

The selected control is approved in principle; these notes define its limits and the evidence still required:

- Vercel's project-specific Ignored Build Step can use “Only build production”, which would allow the staging project's `main` production deployment and cancel preview builds. Official documentation states canceled builds still count as full deployments and consume deployment quota/concurrency, so this does not satisfy a deployment-count reduction claim even if it reduces Build CPU.
- `git.deploymentEnabled` can prevent branch deployments, but it is repository configuration. Because the same repository feeds both Vercel projects, a shared branch rule risks removing required production-project previews unless a project-specific evaluated configuration is proven.
- Disconnecting the staging Git integration and triggering only `main` through a deploy hook/CI can meet project isolation, but adds a deploy secret and delivery integration and is not a settings-only change.
- A single-project/custom-environment redesign is broader architecture and remains out of scope unless the team explicitly re-enters governance.

Before Phase B development, the owner must demonstrate in a disposable branch/project or vendor-supported configuration that the chosen control:

1. is scoped only to `renivet-marketplace-staging`;
2. creates no unwanted staging deployment/build under the agreed metric;
3. preserves production-project previews;
4. preserves `main` staging and `master` production behavior;
5. has an immediate, tested rollback; and
6. does not require an unsupported savings claim.

## Validation and rollback

Capture a same-window before/after sample with commit SHA, branch, project, target, deployment state, build state/duration, and timestamp. Test a throwaway feature branch, `main`, and `master`. Check the staging domain and production domain after each applicable deployment.

Rollback restores the previous staging-project trigger behavior only. Re-run the same matrix and confirm feature-branch staging behavior returns without affecting production. Never use a repository-wide rule as rollback unless its production-project effects were separately proven.

Official references consulted:

- https://vercel.com/docs/git
- https://vercel.com/docs/project-configuration/project-settings#ignored-build-step
- https://vercel.com/docs/project-configuration/git-configuration
