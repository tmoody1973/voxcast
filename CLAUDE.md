# Voxcast - Claude Code Instructions

## Project Overview

**Voxcast** is an AI-powered SaaS platform providing management consultants for public radio stations. It features four specialized AI agents (Development, Marketing, Underwriting, Programming) orchestrated by **Station Pulse** — a Chief of Staff intelligence layer.

**Status:** Pre-development planning phase
**PRD Version:** 2.0 (January 2026)

## Key Documentation

| Document | Path | Purpose |
|----------|------|---------|
| PRD | `voxcast_PRD.md` | Product requirements, architecture, roadmap |
| Brainstorming Results | `docs/brainstorming-session-results.md` | 44 feature capabilities from persona sessions |
| Agent Definitions | `context/agents/*.md` | 4 specialized agent configurations |

## Architecture Overview

```
                    ┌─────────────────┐
                    │  STATION PULSE  │
                    │  (Chief of Staff)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  SARAH   │◄──────►│  MARCUS  │◄──────►│  DIANA   │
   │ (Dev)    │        │ (Mktg)   │        │ (Under)  │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                      ┌──────────┐
                      │  JORDAN  │
                      │ (Prog)   │
                      └──────────┘
```

## Tech Stack (Planned)

- **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Convex (real-time database + functions)
- **Auth:** Clerk
- **AI:** Claude API with tool use
- **Payments:** Stripe

## BMAD Framework

This project uses BMAD (Business Method for Agile Development) with custom agents:

| Agent | Role | Key Responsibilities |
|-------|------|---------------------|
| PM | Product Manager | PRD updates, roadmap |
| Architect | Technical Architecture | System design, data models |
| SM | Scrum Master | Story creation, sprint planning |
| QA | Quality Assurance | Testing, validation |
| Dev | Developer | Implementation |

### BMAD Commands
- `/analyst` - Business analysis, brainstorming
- `/architect` - Technical architecture sessions
- `/pm` - Product management tasks
- `/sm` - Scrum master, story creation
- `/qa` - Quality assurance reviews

## BMAD + Linear Automatic Sync

This rule maintains synchronization between BMAD-METHOD artifacts and Linear issues.

### When Working with BMAD Agents

#### After PM Agent Creates/Updates PRD
- Offer to sync major features to Linear as epics
- Each PRD section with user-facing value = potential epic
- Link epic back to PRD section

#### After Architect Agent Completes Architecture
- Create spike issues for any "TBD" or "needs research" items
- Link architectural decisions to relevant epics
- Note any technical risks as Linear issues with `risk` label

#### After Scrum Master Creates Stories
- Offer to create Linear issue for each new story
- Map story complexity to Linear estimate
- Identify and link dependencies between stories

### During Development

#### When Starting Work on a Story
1. Check if Linear issue exists for this story
2. If yes: Move to "In Progress", add comment
3. If no: Offer to create it first
4. Reference the story file path in Linear

#### When Completing Implementation
1. Update Linear with implementation summary
2. Note any deviations from original story
3. Move to "In Review" (QA phase)
4. Link any relevant commits or PRs

#### When QA Agent Reviews
1. If approved: Move to "Done"
2. If issues found: Add QA notes as comment, keep "In Review" or move back
3. Create separate bug issues for defects (link to story)

### Story File ↔ Linear Mapping

Keep story files as **requirements source of truth**.
Keep Linear as **status source of truth**.

### Commands to Recognize

| User Says | Action |
|-----------|--------|
| "sync stories to Linear" | Check all stories/, create missing issues |
| "update Linear from PRD" | Sync PRD changes to epic descriptions |
| "link story-X to HKV-Y" | Add linear-id to story frontmatter |
| "what's not in Linear yet" | Find stories without linear-id |
| "sprint planning" | Show unassigned stories, help prioritize |

### Status Mapping

| BMAD Story State | Linear Status |
|-----------------|---------------|
| Created by SM | Backlog |
| Assigned to Dev | Todo |
| Dev working | In Progress |
| Ready for QA | In Review |
| QA approved | Done |
| Blocked | Blocked (with reason) |

### Don't Over-Sync

- Don't create Linear issues for tiny tasks (< 30 min)
- Don't duplicate: one story = one issue
- Don't spam comments - meaningful updates only
- If Linear MCP not connected, note it once and continue with BMAD workflow

## Context7 Documentation Search

When working with APIs, libraries, or frameworks, use Context7 MCP to fetch up-to-date documentation.

### When to Use Context7

- Before implementing integrations with external APIs (Clerk, Stripe, Convex, etc.)
- When encountering unfamiliar library APIs or patterns
- To verify current syntax and best practices for dependencies
- When debugging issues that may be version-specific

### How to Use

1. **Resolve library ID first:**
   ```
   mcp__context7__resolve-library-id
   - libraryName: "convex" (or other library)
   - query: "what you're trying to do"
   ```

2. **Query documentation:**
   ```
   mcp__context7__query-docs
   - libraryId: "/vercel/next.js" (from resolve step)
   - query: "specific question about the API"
   ```

### Key Libraries for Voxcast

| Library | Typical ID | Use Case |
|---------|-----------|----------|
| Next.js | `/vercel/next.js` | App router, server components |
| Convex | `/convex-dev/convex` | Database, real-time, functions |
| Clerk | `/clerk/clerk` | Authentication |
| Stripe | `/stripe/stripe-node` | Payments |
| Tailwind | `/tailwindlabs/tailwindcss` | Styling |
| shadcn/ui | `/shadcn-ui/ui` | Components |

### Best Practices

- Always check Context7 before assuming API patterns
- Use for current documentation rather than relying on training data
- Limit to 3 calls per question to avoid excessive lookups
- Cache mentally the patterns you learn for the session

## Directory Structure

```
voxcast/
├── voxcast_PRD.md              # Main product requirements
├── docs/                        # Documentation
│   └── brainstorming-session-results.md
├── context/                     # Agent context & knowledge
│   ├── agents/                  # 4 agent definitions
│   │   └── dependencies/        # Agent-specific resources
│   ├── docs/                    # Framework documentation
│   └── examples/                # Example sessions
├── .claude/                     # Claude Code configuration
│   ├── rules/                   # Custom rules
│   └── commands/                # BMAD agent commands
├── .bmad-core/                  # Core BMAD framework
└── .bmad-creative-writing/      # Creative writing extensions
```

## Development Priorities

### Phase 1: Foundation (Current Focus)
1. Station Pulse technical architecture
2. Core agent framework
3. Basic UI shell

### Priority Features (from Brainstorming)
1. **Prep Briefs System** - Role-specific intelligence before meetings
2. **Quiet Attrition Detection** - Surface donors going cold
3. **Consequence Preview** - Impact forecast before programming decisions

## Working Conventions

### When Creating Stories
1. Check Linear for existing issues first
2. Use story frontmatter format:
   ```yaml
   ---
   id: story-001
   title: Feature Title
   linear-id: HKV-XX
   status: pending
   sprint: 2025-WXX
   ---
   ```

### When Starting Development
1. Create feature branch
2. Link to Linear issue
3. Update story status

### Code Style (for future development)
- TypeScript strict mode
- Functional components with hooks
- Convex for data layer
- Server components by default (Next.js)

## Quick Commands

```bash
# When starting development (future)
npx create-next-app@latest voxcast-app --typescript --tailwind --app
npx convex dev
```

## Notes

- This is a **planning phase project** - no application code yet
- Use BMAD agents for structured planning and documentation
- Sync major milestones to Linear for tracking
