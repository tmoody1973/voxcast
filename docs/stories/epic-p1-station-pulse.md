# Epic P1: Station Pulse - Chief of Staff Intelligence Layer

---
epic-id: MOO-10
linear-url: https://linear.app/moodyco/issue/MOO-10
status: backlog
priority: P1
---

## Overview

Station Pulse is the cross-agent intelligence orchestration layer that sits above all agents, watching for cross-department signals and correlations.

## Architecture

See: [Station Pulse Technical Architecture](../architecture/station-pulse-technical-architecture.md)

## Stories

| ID | Title | Status | Dependencies |
|----|-------|--------|--------------|
| MOO-13 | Signal Schema & Database Tables | Backlog | None |
| MOO-14 | Signal Emission API | Backlog | MOO-13 |
| MOO-15 | Correlation Engine Core | Backlog | MOO-13, MOO-14 |
| MOO-16 | Collision Detection Rules | Backlog | MOO-15 |
| MOO-17 | Daily Briefing Generator | Backlog | MOO-13, MOO-15, MOO-16 |
| MOO-18 | Knowledge Graph Schema | Backlog | MOO-13 |
| MOO-19 | GM Briefing Dashboard UI | Backlog | MOO-17 |

## Dependency Graph

```
MOO-13 (Signal Schema)
    ├── MOO-14 (Signal Emission API)
    │       └── MOO-15 (Correlation Engine)
    │               └── MOO-16 (Collision Detection)
    │                       └── MOO-17 (Daily Briefing)
    │                               └── MOO-19 (Dashboard UI)
    └── MOO-18 (Knowledge Graph)
```

## Success Criteria

- GM receives actionable daily briefing by 7am
- Cross-agent signals surface within 15 minutes
- Collision alerts prevent costly mistakes
- Knowledge graph captures institutional memory

## Key Collision Types

1. **Programming ↔ Development**: Schedule changes affecting major donors
2. **Marketing ↔ Underwriting**: Campaign conflicts with sponsor expectations
3. **Events ↔ ROI**: Event decisions without revenue visibility
4. **Content ↔ Membership**: Programming not aligned with member preferences
5. **Grant Narrative ↔ Reality**: Reported metrics vs actual performance
