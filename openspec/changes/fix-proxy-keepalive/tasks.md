# Tasks

## 1. The proxy fix

- [ ] 1.1 Add the `upstream` block with `keepalive 64` to `frontend/nginx.conf`,
  set `proxy_http_version 1.1` and an empty `Connection` header in the `/api/`
  and `/media/` locations, and drop the per-request `resolver` + `$backend`
  variable they replace. Verify: the compose configuration check in
  `pnpm check` passes and the stack builds.

## 2. Verification under load

- [ ] 2.1 Re-run the k6 load suite (`perf/scripts/load.js` via the k6 container
  on the stack's network) against the rebuilt stack. Verify: the error rate is
  0% where it was 49.6% before, every p95 stays under its threshold, and the
  back-end answers only on the pooled connections (no `Address not available`
  in the web container's error log). This task records the numbers; no repo
  file changes.

## Workflow follow-up

- Sync the `shared/local-stack` delta spec into `openspec/specs/`, run
  `openspec validate --all --strict`.
- Archive the change on this branch (`/opsx:archive`), set the roadmap status
  to `archived` in the same commit, then push and open the PR to `master`.
