# 0004. JWT access tokens with rotating refresh cookie

Status: Accepted
Date: 2026-10-25

## Context
A SPA talks to a stateless REST API. Email confirmation and OAuth are out of scope.

## Decision
- Email + password login; bcrypt via `DelegatingPasswordEncoder`.
- Short-lived (15 min) JWT access token signed with an HMAC key from the environment,
  validated by Spring Security's OAuth2 resource server support.
- Refresh token: random, stored hashed, 14-day lifetime, rotated on every use,
  sent as an `HttpOnly; SameSite=Strict` cookie limited to `/api/v1/auth`.
- The first admin is created from environment variables at startup.

## Consequences
- The front-end keeps the access token in memory only and refreshes on 401.
- Logout revokes the refresh token server-side.
