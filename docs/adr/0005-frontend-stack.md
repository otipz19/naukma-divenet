# 0005. Front-end libraries, map and i18n

Status: Accepted
Date: 2026-10-25

## Context
The UI needs routing, server-state caching, forms, an interactive clustered map,
and English and Ukrainian translations. API keys and paid services should be avoided.

## Decision
- React Router, TanStack Query, React Hook Form + Zod.
- Leaflet via `react-leaflet` with marker clustering and OpenStreetMap tiles.
- `react-i18next`; locales `en` (default/fallback) and `uk`; key parity is checked
  by the quality gate.
- API types generated from `api/openapi.json` with `openapi-typescript`.
- Visual design: `docs/DESIGN.md`, to be produced with Claude Design; until it
  exists styling stays minimal.

## Consequences
- No map API key is needed; the OSM tile usage policy and attribution apply.
- Adding a UI string always means editing both locale files.
