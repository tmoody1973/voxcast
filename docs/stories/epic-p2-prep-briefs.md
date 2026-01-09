# Epic P2: Prep Briefs System - Role-Specific Intelligence

---
epic-id: MOO-11
linear-url: https://linear.app/moodyco/issue/MOO-11
status: backlog
priority: P2
---

## Overview

Every role needs context before they act. The Prep Briefs System generates role-specific one-pagers before meetings, events, and decisions.

## Stories

| ID | Title | Status | Dependencies |
|----|-------|--------|--------------|
| MOO-20 | Brief Template System Architecture | Backlog | None |
| MOO-21 | 60-Second Donor Prep Brief | Backlog | MOO-20, CRM Integration |
| MOO-22 | Call Prep Sheets (Underwriting) | Backlog | MOO-20 |
| MOO-23 | Event Intelligence Dashboard | Backlog | MOO-20, MOO-21, Event Integration |
| MOO-24 | Brief Trigger System | Backlog | MOO-20, Calendar Integration |

## Dependency Graph

```
MOO-20 (Brief Template System)
    ├── MOO-21 (Donor Prep Brief)
    │       └── MOO-23 (Event Intelligence)
    ├── MOO-22 (Call Prep Sheets)
    └── MOO-24 (Brief Trigger System)
```

## Brief Types

### 60-Second Donor Prep (Development)
1. **Relationship Snapshot**: Giving history, tenure, last contact
2. **What They Care About**: Shows, causes, events they engage with
3. **Landmines to Avoid**: Past complaints, sensitive topics
4. **The Opening**: Personalized conversation starter
5. **Ask Context**: Current campaign, appropriate ask level

### Call Prep Sheets (Underwriting)
1. **Account Overview**: Company, contacts, contract history
2. **Current Contract Status**: Active campaigns, renewal date
3. **Engagement Signals**: Email opens, event attendance
4. **Performance Data**: Impressions, listener recall
5. **Talking Points**: Renewal pitch, upsell opportunities

### Event Intelligence Dashboard (Development)
1. **Attendee Overview**: Count, giving levels, new vs returning
2. **Priority List**: Top 10 donors requiring attention
3. **Renewal Alerts**: Attendees with upcoming renewals
4. **Upgrade Candidates**: Donors ready for increased giving
5. **Seating Strategy**: Suggested table assignments

## Success Criteria

- Brief generated in under 5 seconds
- 80%+ relevance rating from users
- Reduces meeting prep time by 75%
