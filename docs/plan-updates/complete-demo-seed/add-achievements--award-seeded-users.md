---
target: complete-demo-seed
source: add-achievements
kind: add-scope
stories: [US-10]
created: 2026-11-02
---
## What changes for the target
After seeding demo users' dives, posts and sites, call `AchievementService.evaluate` for each of them, so their profiles show earned achievements.

## Why
Awards are made by events from the services, and a seeder that writes rows directly publishes none. Without this, a demo profile shows full progress bars on locked achievements.

## What the source already built
`AchievementService` in `ua.ukma.divenet.achievement.service`. Evaluation reads live data and inserts idempotently, so calling it again on a restart is safe.

## Roadmap edit when absorbed
Delivers: add "seeded users have their achievements".
