# BMAD + Linear Automatic Sync

This rule maintains synchronization between BMAD-METHOD artifacts and Linear issues.

## When Working with BMAD Agents

### After PM Agent Creates/Updates PRD
- Offer to sync major features to Linear as epics
- Each PRD section with user-facing value = potential epic
- Link epic back to PRD section

### After Architect Agent Completes Architecture
- Create spike issues for any "TBD" or "needs research" items
- Link architectural decisions to relevant epics
- Note any technical risks as Linear issues with `risk` label

### After Scrum Master Creates Stories
- Offer to create Linear issue for each new story
- Map story complexity to Linear estimate
- Identify and link dependencies between stories

## During Development

### When Starting Work on a Story
1. Check if Linear issue exists for this story
2. If yes: Move to "In Progress", add comment
3. If no: Offer to create it first
4. Reference the story file path in Linear

### When Completing Implementation
1. Update Linear with implementation summary
2. Note any deviations from original story
3. Move to "In Review" (QA phase)
4. Link any relevant commits or PRs

### When QA Agent Reviews
1. If approved: Move to "Done"
2. If issues found: Add QA notes as comment, keep "In Review" or move back
3. Create separate bug issues for defects (link to story)

## Story File ↔ Linear Mapping

Keep story files as **requirements source of truth**.
Keep Linear as **status source of truth**.

### Recommended Story Frontmatter
```yaml
---
id: story-001
title: User Authentication Flow
linear-id: HKV-42  # Add after creating Linear issue
status: in-progress  # Mirror from Linear
sprint: 2025-W02
---
```

## Commands to Recognize

| User Says | Action |
|-----------|--------|
| "sync stories to Linear" | Check all stories/, create missing issues |
| "update Linear from PRD" | Sync PRD changes to epic descriptions |
| "link story-X to HKV-Y" | Add linear-id to story frontmatter |
| "what's not in Linear yet" | Find stories without linear-id |
| "sprint planning" | Show unassigned stories, help prioritize |

## Status Mapping

| BMAD Story State | Linear Status |
|-----------------|---------------|
| Created by SM | Backlog |
| Assigned to Dev | Todo |
| Dev working | In Progress |
| Ready for QA | In Review |
| QA approved | Done |
| Blocked | Blocked (with reason) |

## Don't Over-Sync

- Don't create Linear issues for tiny tasks (< 30 min)
- Don't duplicate: one story = one issue
- Don't spam comments - meaningful updates only
- If Linear MCP not connected, note it once and continue with BMAD workflow
