# REN-122 Browser-Only Proof Evidence

Command: `bun run agent-browser:network-blocking-spike`

Runtime preflight passed with `agent-browser 0.35.1` and a headless Chrome launch on 2026-08-31.

| Provider | Abort rule | Safe synthetic request | Outcome | Response status |
| --- | --- | --- | --- | --- |
| Delhivery | `https://track.delhivery.com/**` | `GET /renivet-agent-browser-safety-probe` | `request_failed` | none |
| Twilio | `https://api.twilio.com/**` | `GET /renivet-agent-browser-safety-probe` | `request_failed` | none |
| Meta CAPI | `https://graph.facebook.com/**` | `GET /renivet-agent-browser-safety-probe` | `request_failed` | none |
| Resend | `https://api.resend.com/**` | `GET /renivet-agent-browser-safety-probe` | `request_failed` | none |

The runner treats the proof as passing only when it has registered the `--abort` rule, the browser fetch fails, and `agent-browser network requests` records the exact probe URL without a response status. It records only the provider name, abort rule, request method/path, failure outcome, and null response status; no credentials, request headers, payloads, or application navigation are included.

This proves only the browser CDP boundary. It does **not** block or prove control over Next.js server-side calls to Delhivery, Twilio, Meta CAPI, or Resend. Any independent server-egress control needs a separate infrastructure task.
