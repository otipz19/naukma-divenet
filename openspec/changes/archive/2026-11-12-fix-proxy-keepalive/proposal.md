# Proposal

## Why

A k6 load run against the stack (from `measure-performance`, running on the stack's
Docker network) failed 49.6% of requests at only ~860 req/s: nginx opens a new TCP
connection to the back-end for every API request (`proxy_pass` with a variable),
exhausts the container's ephemeral port range, and returns 502 while the port
sockets sit in TIME_WAIT (`connect() failed (99: Address not available)` in the
web container's error log). The latency was never the problem: p95 stayed at
~360 ms while half the answers were 502. Any real deployment would hit the same
cliff at modest traffic.

## What Changes

- `frontend/nginx.conf`: replace the per-request `proxy_pass $backend` variable
  with an `upstream` block that keeps a pool of connections to the back-end
  (`keepalive`), and set `proxy_http_version 1.1` with an empty `Connection`
  header so the pool is actually used. The `resolver` directive goes with the
  variable, since an `upstream` block resolves the back-end's name once at
  startup, which the stack's start order already guarantees (web starts only
  after the back-end is healthy).
- No API, database or front-end code changes; the proxy behavior a client sees
  is unchanged except that it stops failing under load.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared/local-stack`: the "web server proxies the API" requirement gains the
  connection-reuse behavior that failed, so a regression to connect-per-request
  fails a test instead of a load run.

## Impact

- `frontend/nginx.conf` only (the config the `web` compose service builds into
  its image).
- The stack is rebuilt by any run that starts it; no migration, no API change.
- `measure-performance` (in progress) resumes on top of this fix and its error
  thresholds become meaningful.

## Plan updates absorbed

None.
