# 0001. Technology stack

Status: Accepted
Date: 2026-10-25

## Context
The course requires a web application with a separate front-end and a monolithic
back-end, tested at unit, functional and E2E level. Development is done by coding
agents (Claude Code, Codex, Gemini), so mainstream, well-documented tools are preferred.

## Decision
- Back-end: Java 25, Spring Boot 4.1, Maven via the Maven Wrapper (`backend/mvnw`).
- Database: PostgreSQL 17 with PostGIS 3.
- Front-end: React 19 + Vite + TypeScript, pnpm workspace rooted at the repository.
- Local and demo runtime: Docker Compose.
- Repository-level tooling (OpenSpec CLI, quality gate script) runs on Node.js.

## Consequences
- Contributors need JDK 25+, Node.js 24+, pnpm and Docker.
- Maven is not required globally; the wrapper pins its version.
