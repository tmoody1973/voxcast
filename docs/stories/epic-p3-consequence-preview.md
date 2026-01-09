# Epic P3: Consequence Preview - Programming Decision Intelligence

---
epic-id: MOO-12
linear-url: https://linear.app/moodyco/issue/MOO-12
status: backlog
priority: P3
---

## Overview

One-page impact forecast before any programming decision. Prevents costly mistakes like losing a $5K donor due to a schedule change with no visibility into who cared about that show.

## Stories

| ID | Title | Status | Dependencies |
|----|-------|--------|--------------|
| MOO-25 | Show Profile Data Model | Backlog | MOO-18 (Knowledge Graph) |
| MOO-26 | Cross-Department Data Integration | Backlog | MOO-25 |
| MOO-27 | Consequence Forecast Algorithm | Backlog | MOO-25, MOO-26, MOO-18 |
| MOO-28 | Consequence Preview One-Page UI | Backlog | MOO-27, MOO-25 |
| MOO-29 | Show Outcome Tagging System | Backlog | MOO-25 |

## Dependency Graph

```
MOO-18 (Knowledge Graph - from P1)
    └── MOO-25 (Show Profile Data Model)
            ├── MOO-26 (Cross-Dept Integration)
            │       └── MOO-27 (Consequence Algorithm)
            │               └── MOO-28 (Preview UI)
            └── MOO-29 (Outcome Tagging)
```

## Show Profile Fields

- **Audience Metrics**: Nielsen ratings, streaming numbers, trends
- **Development Exposure**: Donors with show affinity, giving tied to show
- **Underwriting**: Active sponsors, contract values, renewal dates
- **Marketing**: Campaigns featuring show, promotional investment
- **Grant Dependencies**: Shows mentioned in grant narratives

## Decision Types Supported

1. **Schedule Change**: Moving a show to different time slot
2. **Show Cancellation**: Ending a program
3. **Time Slot Move**: Shifting start/end times
4. **Host Change**: Replacing on-air talent
5. **Format Adjustment**: Changing show format/content

## Show Outcome Categories

| Category | Definition | Indicators |
|----------|------------|------------|
| **Reach Plays** | Bring new listeners | High acquisition, low retention |
| **Conversion Plays** | Turn listeners to members | High member conversion rate |
| **Brand Plays** | Define station identity | Awards, press mentions |
| **Revenue Plays** | Attract underwriting | High sponsor attachment |

## Success Criteria

- Zero programming decisions cause donor lapse surprises
- PD has cross-department visibility before decisions
- Decision confidence signals reduce stakeholder conflicts

## Key Quote

> *"I stop programming for audience. I start programming for outcome."* — Program Director persona
