# Voxcast Stories

This directory contains story definitions organized by epic. Stories are the **requirements source of truth**, while Linear is the **status source of truth**.

## Epic Overview

| Priority | Epic | Linear ID | Stories | Status |
|----------|------|-----------|---------|--------|
| P1 | [Station Pulse](./epic-p1-station-pulse.md) | MOO-10 | 7 | Backlog |
| P2 | [Prep Briefs System](./epic-p2-prep-briefs.md) | MOO-11 | 5 | Backlog |
| P3 | [Consequence Preview](./epic-p3-consequence-preview.md) | MOO-12 | 5 | Backlog |

**Total Stories**: 17

## Story Index

### P1: Station Pulse (MOO-10)

| ID | Story | File |
|----|-------|------|
| MOO-13 | Signal Schema & Database Tables | [story-moo-13.md](./story-moo-13.md) |
| MOO-14 | Signal Emission API | [story-moo-14.md](./story-moo-14.md) |
| MOO-15 | Correlation Engine Core | [story-moo-15.md](./story-moo-15.md) |
| MOO-16 | Collision Detection Rules | [story-moo-16.md](./story-moo-16.md) |
| MOO-17 | Daily Briefing Generator | [story-moo-17.md](./story-moo-17.md) |
| MOO-18 | Knowledge Graph Schema | [story-moo-18.md](./story-moo-18.md) |
| MOO-19 | GM Briefing Dashboard UI | [story-moo-19.md](./story-moo-19.md) |

### P2: Prep Briefs System (MOO-11)

| ID | Story | File |
|----|-------|------|
| MOO-20 | Brief Template System Architecture | [story-moo-20.md](./story-moo-20.md) |
| MOO-21 | 60-Second Donor Prep Brief | [story-moo-21.md](./story-moo-21.md) |
| MOO-22 | Call Prep Sheets (Underwriting) | [story-moo-22.md](./story-moo-22.md) |
| MOO-23 | Event Intelligence Dashboard | [story-moo-23.md](./story-moo-23.md) |
| MOO-24 | Brief Trigger System | [story-moo-24.md](./story-moo-24.md) |

### P3: Consequence Preview (MOO-12)

| ID | Story | File |
|----|-------|------|
| MOO-25 | Show Profile Data Model | [story-moo-25.md](./story-moo-25.md) |
| MOO-26 | Cross-Department Data Integration | [story-moo-26.md](./story-moo-26.md) |
| MOO-27 | Consequence Forecast Algorithm | [story-moo-27.md](./story-moo-27.md) |
| MOO-28 | Consequence Preview One-Page UI | [story-moo-28.md](./story-moo-28.md) |
| MOO-29 | Show Outcome Tagging System | [story-moo-29.md](./story-moo-29.md) |

## Cross-Epic Dependencies

```
P1: Station Pulse
    └── MOO-18 (Knowledge Graph)
            │
            ▼
P3: Consequence Preview
    └── MOO-25 (Show Profile) ──► MOO-27 (Algorithm) ──► MOO-28 (UI)
```

The Knowledge Graph (MOO-18) from P1 is a prerequisite for P3's Show Profile Data Model (MOO-25).

## Story File Convention

Each story file follows this frontmatter format:

```yaml
---
id: story-XXX
title: Story Title
linear-id: MOO-XX
status: backlog  # Mirror from Linear
sprint: null     # Assigned when planned
---
```

## Sync Commands

| Command | Action |
|---------|--------|
| "sync stories to Linear" | Create missing Linear issues |
| "update from Linear" | Sync status changes |
| "what's not in Linear yet" | Find unsynced stories |
| "sprint planning" | Show unassigned stories |
