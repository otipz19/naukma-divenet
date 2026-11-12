# Design

## Context

`frontend/nginx.conf` proxies `/api/` and `/media/` with `proxy_pass $backend`,
where `$backend` is a variable resolved per request through Docker's DNS. A
variable in `proxy_pass` disables nginx's upstream connection reuse, so every
proxied request opens a fresh TCP connection to the back-end. `measure-performance`'s
k6 run (in the stack's network, ~860 req/s) failed 49.6% of requests with
`connect() to <backend>:8080 failed (99: Address not available)` — the container's
ephemeral port range exhausted while earlier connections sat in TIME_WAIT.

## Goals / Non-Goals

Goals: a connection pool between nginx and the back-end, verified under load.

Non-Goals: any change to latency budgets, caching, or response behavior; other
proxy hardening (rate limiting, buffering tunables).

## Decisions

**D1: `upstream` block with `keepalive`, not per-request resolution.** The pool
(`keepalive 64` with `proxy_http_version 1.1` and `proxy_set_header Connection
""`) is nginx's standard way to reuse connections. The trade-off: an `upstream`
block resolves `backend` once at startup, so a back-end container recreated with
a new address would not be followed until web restarts — but compose starts web
only after the back-end is healthy and recreates both together, so the per-request
`resolver` the config carried buys nothing here. Alternative considered:
`resolver` + variable with `keepalive` — not possible, nginx refuses connection
reuse with variables in `proxy_pass`.

**D2: one pool for `/api/` and `/media/`, set in a shared include.** Both
locations proxy to the same upstream; the pool directives are repeated in both
(nginx has no scoped inheritance for these without includes, and a shared
include file for two blocks adds indirection for no gain).

**D3: verification is the k6 scenario again, not a unit test.** The failure is
emergent (time × port exhaustion), so no unit test can see it: the load run of
`measure-performance` against the fixed stack, in-network, with the error-rate
thresholds now expected to hold, is the verification. The compose configuration
check in `pnpm check` still validates the stack builds and starts.

## Risks / Trade-offs

- [A recreated back-end with a changed address is not followed until web
  restarts] → accepted: compose recreates both services together; the stack's
  own health checks would surface a broken pair immediately.
- [Pool of 64 may saturate at much higher loads] → the pool is per-worker;
  at the loads this product is built for, 64 idle connections is ample, and the
  load run verifies it.

## Migration Plan

Config-only, shipped inside the web image; every stack start rebuilds it.
Rollback is reverting `frontend/nginx.conf`.
