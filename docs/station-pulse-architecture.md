# Station Pulse: Technical Architecture

**Version:** 1.0
**Date:** January 8, 2026
**Status:** Design Draft
**Author:** Tarik Moody

---

## 1. Executive Summary

Station Pulse is the cross-agent intelligence orchestration layer for Voxcast. It acts as a "Chief of Staff" that watches signals across all four agents (Sarah, Marcus, Diana, Jordan), correlates patterns, detects collisions, and generates proactive daily briefings for station leadership.

### Core Insight
> *"I don't need dashboards. I need to know what's about to break before it breaks."*

### Key Capabilities
1. **Signal Aggregation** — Collect events and data from all agents
2. **Pattern Correlation** — Detect meaningful patterns across departments
3. **Collision Detection** — Flag when decisions in one department affect another
4. **Momentum Tracking** — Identify what's gaining or losing steam
5. **Daily Briefings** — Prioritized intelligence with recommended actions

---

## 2. System Architecture

### 2.1 High-Level View

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STATION PULSE                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Correlation Engine                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │ │
│  │  │   Pattern    │ │   Collision  │ │   Momentum   │                │ │
│  │  │   Detector   │ │   Detector   │ │   Tracker    │                │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Signal Store (Convex)                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │ │
│  │  │  Sarah   │ │  Marcus  │ │  Diana   │ │  Jordan  │               │ │
│  │  │ Signals  │ │ Signals  │ │ Signals  │ │ Signals  │               │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Briefing Generator                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │ │
│  │  │  Priority    │ │  Action      │ │  Delivery    │                │ │
│  │  │  Ranker      │ │  Recommender │ │  Scheduler   │                │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
   ┌──────────┐              ┌──────────┐              ┌──────────┐
   │  Sarah   │              │  Diana   │              │  Jordan  │
   │  Agent   │◄────────────►│  Agent   │◄────────────►│  Agent   │
   └──────────┘              └──────────┘              └──────────┘
         │                                                   │
         └───────────────────┐       ┌───────────────────────┘
                             │       │
                             ▼       ▼
                        ┌──────────────┐
                        │   Marcus     │
                        │   Agent      │
                        └──────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| **Signal Store** | Persist and index all agent signals | Convex tables + indexes |
| **Pattern Detector** | Find correlations across signal types | Convex scheduled functions |
| **Collision Detector** | Check decision impacts across departments | Rule-based engine |
| **Momentum Tracker** | Measure velocity of metrics over time | Time-series analysis |
| **Priority Ranker** | Score and rank alerts by importance | Weighted scoring algorithm |
| **Action Recommender** | Suggest next steps for each alert | Template + context matching |
| **Briefing Generator** | Compile daily briefing document | Scheduled Convex function |
| **Delivery Scheduler** | Send briefings at configured times | Convex cron jobs |

---

## 3. Data Model

### 3.1 Signal Schema

```typescript
// convex/schema.ts

// Signals emitted by agents and tracked by Station Pulse
signals: defineTable({
  stationId: v.id("stations"),

  // Signal identification
  signalType: v.string(),          // "donor_engagement", "sponsor_silence", etc.
  signalCategory: v.union(
    v.literal("engagement"),       // Interaction events
    v.literal("financial"),        // Money-related signals
    v.literal("relationship"),     // Relationship health
    v.literal("content"),          // Programming/content signals
    v.literal("external"),         // External market signals
    v.literal("operational")       // Internal operations
  ),

  // Source
  sourceAgent: v.union(
    v.literal("sarah"),
    v.literal("marcus"),
    v.literal("diana"),
    v.literal("jordan"),
    v.literal("system")
  ),

  // Signal data
  entityType: v.string(),          // "donor", "sponsor", "show", "campaign"
  entityId: v.optional(v.string()), // Reference to the entity
  entityName: v.optional(v.string()),

  // Signal value
  value: v.optional(v.number()),    // Numeric value if applicable
  previousValue: v.optional(v.number()),
  delta: v.optional(v.number()),    // Change from previous
  direction: v.optional(v.union(
    v.literal("up"),
    v.literal("down"),
    v.literal("stable")
  )),

  // Metadata
  description: v.string(),          // Human-readable description
  metadata: v.optional(v.any()),    // Additional context

  // Severity
  severity: v.union(
    v.literal("info"),
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),

  // Status
  status: v.union(
    v.literal("active"),
    v.literal("acknowledged"),
    v.literal("resolved"),
    v.literal("expired")
  ),
  acknowledgedBy: v.optional(v.id("users")),
  acknowledgedAt: v.optional(v.number()),
  resolvedAt: v.optional(v.number()),

  // Timestamps
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
})
  .index("by_station", ["stationId"])
  .index("by_station_type", ["stationId", "signalType"])
  .index("by_station_category", ["stationId", "signalCategory"])
  .index("by_station_agent", ["stationId", "sourceAgent"])
  .index("by_station_severity", ["stationId", "severity"])
  .index("by_station_active", ["stationId", "status", "createdAt"]),

// Correlations detected by Station Pulse
correlations: defineTable({
  stationId: v.id("stations"),

  // Correlation identification
  correlationType: v.string(),      // "donor_sponsor_overlap", "schedule_donor_risk"

  // Related signals
  signalIds: v.array(v.id("signals")),

  // Correlation data
  description: v.string(),
  confidence: v.number(),           // 0-1 confidence score
  impact: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),

  // Affected entities
  affectedEntities: v.array(v.object({
    type: v.string(),
    id: v.optional(v.string()),
    name: v.string(),
  })),

  // Recommended actions
  recommendedActions: v.array(v.object({
    action: v.string(),
    owner: v.optional(v.string()),   // Agent or user
    priority: v.number(),
  })),

  // Status
  status: v.union(
    v.literal("active"),
    v.literal("acknowledged"),
    v.literal("resolved")
  ),

  // Timestamps
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
})
  .index("by_station", ["stationId"])
  .index("by_station_type", ["stationId", "correlationType"])
  .index("by_station_active", ["stationId", "status"]),

// Daily briefings generated by Station Pulse
briefings: defineTable({
  stationId: v.id("stations"),

  // Briefing metadata
  briefingDate: v.string(),         // "2026-01-08"
  briefingType: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("alert")
  ),

  // Content
  priorityItems: v.array(v.object({
    level: v.union(v.literal("HIGH"), v.literal("MEDIUM"), v.literal("LOW")),
    category: v.string(),
    summary: v.string(),
    context: v.optional(v.string()),
    recommendedAction: v.optional(v.string()),
    owner: v.optional(v.string()),
    relatedSignalIds: v.optional(v.array(v.id("signals"))),
    relatedCorrelationId: v.optional(v.id("correlations")),
  })),

  signalsToWatch: v.array(v.string()),

  crossDepartmentActivity: v.object({
    sarah: v.optional(v.string()),
    marcus: v.optional(v.string()),
    diana: v.optional(v.string()),
    jordan: v.optional(v.string()),
  }),

  // Delivery
  generatedAt: v.number(),
  deliveredAt: v.optional(v.number()),
  deliveryMethod: v.optional(v.union(
    v.literal("dashboard"),
    v.literal("email"),
    v.literal("slack")
  )),

  // Engagement
  viewedAt: v.optional(v.number()),
  viewedBy: v.optional(v.id("users")),
})
  .index("by_station", ["stationId"])
  .index("by_station_date", ["stationId", "briefingDate"]),
```

### 3.2 Signal Taxonomy

```typescript
// lib/stationPulse/signalTypes.ts

export const SIGNAL_TAXONOMY = {
  // === SARAH (Development) ===
  sarah: {
    // Engagement signals
    donor_engagement: {
      category: "engagement",
      severity_rules: {
        no_contact_30_days: "medium",
        no_contact_60_days: "high",
        no_contact_90_days: "critical",
      },
    },
    donor_attrition_risk: {
      category: "relationship",
      severity_rules: {
        minor_decline: "low",
        moderate_decline: "medium",
        significant_decline: "high",
        lapse_imminent: "critical",
      },
    },
    major_gift_opportunity: {
      category: "financial",
      severity_rules: {
        potential_upgrade: "medium",
        ready_for_ask: "high",
      },
    },
    event_attendance: {
      category: "engagement",
      severity_rules: {
        attended: "info",
        declined: "low",
        no_response: "medium",
      },
    },
    campaign_performance: {
      category: "financial",
      severity_rules: {
        on_track: "info",
        slightly_behind: "low",
        significantly_behind: "high",
        crisis: "critical",
      },
    },
  },

  // === MARCUS (Marketing) ===
  marcus: {
    audience_growth: {
      category: "engagement",
      severity_rules: {
        strong_growth: "info",
        flat: "low",
        decline: "medium",
        significant_decline: "high",
      },
    },
    campaign_performance: {
      category: "engagement",
      severity_rules: {
        exceeding: "info",
        on_target: "info",
        underperforming: "medium",
        failing: "high",
      },
    },
    channel_efficiency: {
      category: "operational",
      severity_rules: {
        high_roi: "info",
        moderate_roi: "low",
        low_roi: "medium",
        negative_roi: "high",
      },
    },
    brand_mention: {
      category: "external",
      severity_rules: {
        positive: "info",
        neutral: "info",
        negative: "high",
        crisis: "critical",
      },
    },
  },

  // === DIANA (Underwriting) ===
  diana: {
    sponsor_engagement: {
      category: "engagement",
      severity_rules: {
        regular_contact: "info",
        reduced_contact: "low",
        silence_14_days: "medium",
        silence_30_days: "high",
      },
    },
    renewal_risk: {
      category: "financial",
      severity_rules: {
        likely_renew: "info",
        uncertain: "medium",
        at_risk: "high",
        likely_churn: "critical",
      },
    },
    pipeline_health: {
      category: "financial",
      severity_rules: {
        healthy: "info",
        light: "medium",
        critical: "high",
      },
    },
    contract_expiration: {
      category: "operational",
      severity_rules: {
        30_plus_days: "info",
        14_to_30_days: "medium",
        under_14_days: "high",
        expired: "critical",
      },
    },
  },

  // === JORDAN (Programming) ===
  jordan: {
    ratings_change: {
      category: "content",
      severity_rules: {
        significant_increase: "info",
        stable: "info",
        decline: "medium",
        significant_decline: "high",
      },
    },
    schedule_change_proposed: {
      category: "content",
      severity_rules: {
        minor_change: "low",
        moderate_change: "medium",
        major_change: "high",
      },
    },
    partnership_opportunity: {
      category: "external",
      severity_rules: {
        exploratory: "info",
        active_discussion: "medium",
        decision_pending: "high",
      },
    },
    show_performance: {
      category: "content",
      severity_rules: {
        top_performer: "info",
        average: "info",
        underperforming: "medium",
        poor: "high",
      },
    },
  },

  // === SYSTEM ===
  system: {
    grant_deadline: {
      category: "operational",
      severity_rules: {
        30_plus_days: "info",
        14_to_30_days: "medium",
        under_14_days: "high",
        overdue: "critical",
      },
    },
    compliance_issue: {
      category: "operational",
      severity_rules: {
        minor: "low",
        moderate: "medium",
        serious: "high",
        critical: "critical",
      },
    },
  },
} as const;
```

---

## 4. Collision Detection

### 4.1 The Five Collision Types

Based on brainstorming session findings, we track five primary collision types:

```typescript
// lib/stationPulse/collisionRules.ts

export const COLLISION_RULES = {
  // 1. Programming ↔ Development
  programming_development: {
    description: "Schedule changes affecting donors who love specific shows",
    triggers: [
      {
        signal: "schedule_change_proposed",
        check: async (ctx, signal) => {
          // Find donors who have mentioned this show
          const affectedDonors = await ctx.db
            .query("donorShowPreferences")
            .withIndex("by_show", q => q.eq("showId", signal.entityId))
            .collect();

          const majorDonors = affectedDonors.filter(d => d.givingLevel >= 1000);

          if (majorDonors.length > 0) {
            return {
              collision: true,
              severity: majorDonors.length >= 3 ? "high" : "medium",
              affectedEntities: majorDonors.map(d => ({
                type: "donor",
                id: d.donorId,
                name: d.donorName,
              })),
              description: `${majorDonors.length} major donors cite this show as important`,
              recommendedAction: "Notify Sarah before finalizing schedule change",
            };
          }
          return { collision: false };
        },
      },
    ],
  },

  // 2. Marketing ↔ Underwriting
  marketing_underwriting: {
    description: "Campaign timing conflicting with sponsor sensitivities",
    triggers: [
      {
        signal: "campaign_launch",
        check: async (ctx, signal) => {
          // Check if campaign messaging conflicts with active sponsors
          const activeSponsors = await ctx.db
            .query("sponsors")
            .withIndex("by_station_active", q =>
              q.eq("stationId", signal.stationId).eq("status", "active")
            )
            .collect();

          // Check for competitive conflicts
          const conflicts = activeSponsors.filter(s =>
            s.competitiveCategories?.includes(signal.metadata?.category)
          );

          if (conflicts.length > 0) {
            return {
              collision: true,
              severity: "high",
              affectedEntities: conflicts.map(s => ({
                type: "sponsor",
                id: s._id,
                name: s.companyName,
              })),
              description: `Campaign may conflict with ${conflicts.length} sponsor agreements`,
              recommendedAction: "Review with Diana before launch",
            };
          }
          return { collision: false };
        },
      },
    ],
  },

  // 3. Events ↔ ROI
  events_roi: {
    description: "Event effort vs. actual return on investment",
    triggers: [
      {
        signal: "event_completed",
        check: async (ctx, signal) => {
          const event = signal.metadata;
          const costPerAttendee = event.totalCost / event.attendeeCount;
          const revenueGenerated = event.donationsReceived + event.pledgesReceived;
          const roi = (revenueGenerated - event.totalCost) / event.totalCost;

          if (roi < 0) {
            return {
              collision: true,
              severity: roi < -0.5 ? "high" : "medium",
              description: `Event had negative ROI: ${(roi * 100).toFixed(0)}%`,
              recommendedAction: "Review event strategy with Sarah",
              metadata: { roi, costPerAttendee, revenueGenerated },
            };
          }
          return { collision: false };
        },
      },
    ],
  },

  // 4. Content ↔ Membership
  content_membership: {
    description: "What we air vs. who supports us",
    triggers: [
      {
        signal: "schedule_change_proposed",
        check: async (ctx, signal) => {
          // Cross-reference show listeners with sustaining members
          const showListeners = await getShowListenerProfile(ctx, signal.entityId);
          const memberOverlap = showListeners.sustainingMemberPercentage;

          if (memberOverlap > 30) {
            return {
              collision: true,
              severity: memberOverlap > 50 ? "high" : "medium",
              description: `${memberOverlap}% of sustaining members listen to this show`,
              recommendedAction: "Generate Consequence Preview before deciding",
            };
          }
          return { collision: false };
        },
      },
    ],
  },

  // 5. Grant Narrative ↔ Reality
  grant_narrative_reality: {
    description: "What we promised funders vs. what we're actually doing",
    triggers: [
      {
        signal: "schedule_change_proposed",
        check: async (ctx, signal) => {
          // Check if this show is mentioned in active grant commitments
          const grantCommitments = await ctx.db
            .query("grantCommitments")
            .withIndex("by_show", q => q.eq("showId", signal.entityId))
            .filter(q => q.eq(q.field("status"), "active"))
            .collect();

          if (grantCommitments.length > 0) {
            return {
              collision: true,
              severity: "high",
              affectedEntities: grantCommitments.map(g => ({
                type: "grant",
                id: g.grantId,
                name: g.grantName,
              })),
              description: `Show is committed in ${grantCommitments.length} active grants`,
              recommendedAction: "Review grant compliance before proceeding",
            };
          }
          return { collision: false };
        },
      },
    ],
  },
};
```

### 4.2 Collision Detection Flow

```
Signal Emitted
      │
      ▼
┌─────────────────────┐
│  Signal Processor   │
│  (Convex mutation)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check Collision     │
│ Rules by Signal     │
│ Type                │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
No Collision   Collision Detected
    │                  │
    ▼                  ▼
  Done         ┌─────────────────┐
               │ Create          │
               │ Correlation     │
               │ Record          │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ Notify Affected │
               │ Agents/Users    │
               └─────────────────┘
```

---

## 5. Briefing Generation

### 5.1 Daily Briefing Scheduler

```typescript
// convex/stationPulse/generateBriefing.ts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Generate daily briefing at 6:00 AM station local time
crons.daily(
  "generate-daily-briefings",
  { hourUTC: 11, minuteUTC: 0 }, // 6 AM EST
  internal.stationPulse.generateAllBriefings
);

export default crons;
```

### 5.2 Briefing Generation Logic

```typescript
// convex/stationPulse/generateBriefing.ts

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const generateBriefing = internalMutation({
  args: { stationId: v.id("stations") },
  handler: async (ctx, { stationId }) => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Gather active signals from last 24 hours
    const recentSignals = await ctx.db
      .query("signals")
      .withIndex("by_station_active", q =>
        q.eq("stationId", stationId).eq("status", "active")
      )
      .filter(q => q.gte(q.field("createdAt"), Date.now() - 24 * 60 * 60 * 1000))
      .collect();

    // 2. Gather active correlations
    const activeCorrelations = await ctx.db
      .query("correlations")
      .withIndex("by_station_active", q =>
        q.eq("stationId", stationId).eq("status", "active")
      )
      .collect();

    // 3. Rank and prioritize items
    const priorityItems = rankBriefingItems(recentSignals, activeCorrelations);

    // 4. Gather signals to watch (lower priority but noteworthy)
    const signalsToWatch = recentSignals
      .filter(s => s.severity === "low" || s.severity === "info")
      .slice(0, 5)
      .map(s => s.description);

    // 5. Gather cross-department activity
    const crossDepartmentActivity = await gatherDepartmentActivity(ctx, stationId);

    // 6. Create briefing record
    const briefingId = await ctx.db.insert("briefings", {
      stationId,
      briefingDate: today,
      briefingType: "daily",
      priorityItems,
      signalsToWatch,
      crossDepartmentActivity,
      generatedAt: Date.now(),
    });

    return briefingId;
  },
});

function rankBriefingItems(
  signals: Signal[],
  correlations: Correlation[]
): PriorityItem[] {
  const items: PriorityItem[] = [];

  // Add high/critical signals
  for (const signal of signals) {
    if (signal.severity === "high" || signal.severity === "critical") {
      items.push({
        level: signal.severity === "critical" ? "HIGH" : "MEDIUM",
        category: signal.signalType,
        summary: signal.description,
        context: signal.metadata?.context,
        recommendedAction: getRecommendedAction(signal),
        owner: signal.sourceAgent,
        relatedSignalIds: [signal._id],
      });
    }
  }

  // Add correlations (always high priority)
  for (const correlation of correlations) {
    items.push({
      level: correlation.impact === "critical" ? "HIGH" : "MEDIUM",
      category: "collision_detected",
      summary: correlation.description,
      recommendedAction: correlation.recommendedActions[0]?.action,
      owner: correlation.recommendedActions[0]?.owner,
      relatedCorrelationId: correlation._id,
    });
  }

  // Sort by priority level
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return items.sort((a, b) => priorityOrder[a.level] - priorityOrder[b.level]);
}

async function gatherDepartmentActivity(
  ctx: MutationCtx,
  stationId: Id<"stations">
): Promise<CrossDepartmentActivity> {
  // Get recent conversation summaries for each agent
  const agents = ["sarah", "marcus", "diana", "jordan"] as const;
  const activity: Record<string, string> = {};

  for (const agent of agents) {
    const recentConversation = await ctx.db
      .query("conversations")
      .withIndex("by_station", q => q.eq("stationId", stationId))
      .filter(q => q.eq(q.field("agents"), [agent]))
      .order("desc")
      .first();

    if (recentConversation) {
      // Summarize what this agent is working on
      activity[agent] = await summarizeAgentActivity(ctx, recentConversation._id);
    }
  }

  return activity;
}
```

### 5.3 Briefing Output Format

```yaml
# Example Daily Briefing Output
# Generated: Monday, January 8, 2026, 6:00 AM

station: HYFIN
date: 2026-01-08

priority_items:
  - level: HIGH
    category: donor_attrition_risk
    summary: "Margaret Chen (Major Donor, $5,000) hasn't been contacted in 47 days"
    context: "Last interaction was at Gala. She mentioned interest in local music programming."
    recommended_action: "Schedule coffee meeting this week"
    owner: sarah
    signal_ids: ["signal_abc123"]

  - level: HIGH
    category: collision_detected
    summary: "Thursday 2PM schedule change may impact donors and sponsors"
    context: |
      - 4 major donors cite 'Local Rhythms' as why they give
      - 2 underwriters specifically bought this daypart
      - Grant narrative mentions show's community impact
    recommended_action: "Generate Consequence Preview before deciding. Loop in Sarah and Diana."
    owner: jordan
    correlation_id: "corr_xyz789"

  - level: MEDIUM
    category: renewal_risk
    summary: "Q1 sponsor renewal conversation stalled (Day 12 of silence)"
    context: "Last meeting was positive but no response to proposal revision."
    recommended_action: "Follow up with direct call this week"
    owner: diana

signals_to_watch:
  - "3 sustainers downgraded this week — unusual pattern worth monitoring"
  - "Board meeting in 5 days — deck not started"
  - "New podcast episode had 2x normal downloads"

cross_department_activity:
  sarah: "Working on year-end campaign. 3 major gift visits scheduled this week."
  marcus: "Social campaign launching Wednesday. New Instagram strategy test."
  diana: "Q1 renewals in progress. 4 active negotiations, 2 pending proposals."
  jordan: "Schedule review for February. Partnership discussions with NPR affiliate."

generated_at: "2026-01-08T06:00:00Z"
```

---

## 6. Agent Signal Emission

### 6.1 Signal Emission Interface

```typescript
// lib/stationPulse/emitSignal.ts

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export interface EmitSignalParams {
  signalType: string;
  signalCategory: SignalCategory;
  entityType: string;
  entityId?: string;
  entityName?: string;
  value?: number;
  previousValue?: number;
  description: string;
  severity: SignalSeverity;
  metadata?: Record<string, any>;
  expiresIn?: number; // milliseconds
}

export function useEmitSignal() {
  const emit = useMutation(api.stationPulse.emitSignal);

  return async (
    stationId: string,
    sourceAgent: AgentId,
    params: EmitSignalParams
  ) => {
    return emit({
      stationId,
      sourceAgent,
      ...params,
      delta: params.previousValue !== undefined
        ? params.value! - params.previousValue
        : undefined,
      direction: params.previousValue !== undefined
        ? params.value! > params.previousValue ? "up"
        : params.value! < params.previousValue ? "down"
        : "stable"
        : undefined,
    });
  };
}
```

### 6.2 Agent Integration Example

```typescript
// lib/agents/sarah/tools/analyzeDonorData.ts

export async function analyzeDonorData(
  ctx: AgentContext,
  input: { donorId: string }
): Promise<ToolResult> {
  const donor = await ctx.db.get("donors", input.donorId);
  const lastContact = await getLastContactDate(ctx, input.donorId);
  const daysSinceContact = daysBetween(lastContact, new Date());

  // Emit signal if contact is overdue
  if (daysSinceContact > 30) {
    await ctx.emitSignal({
      signalType: "donor_engagement",
      signalCategory: "relationship",
      entityType: "donor",
      entityId: input.donorId,
      entityName: donor.name,
      value: daysSinceContact,
      description: `${donor.name} hasn't been contacted in ${daysSinceContact} days`,
      severity: daysSinceContact > 60 ? "high" : "medium",
      metadata: {
        lastContactDate: lastContact.toISOString(),
        givingLevel: donor.totalGiving,
        lastGiftAmount: donor.lastGiftAmount,
      },
    });
  }

  // Also check for attrition risk
  const engagementTrend = await calculateEngagementTrend(ctx, input.donorId);
  if (engagementTrend < -0.3) {
    await ctx.emitSignal({
      signalType: "donor_attrition_risk",
      signalCategory: "relationship",
      entityType: "donor",
      entityId: input.donorId,
      entityName: donor.name,
      value: engagementTrend,
      description: `${donor.name} engagement declining (${(engagementTrend * 100).toFixed(0)}%)`,
      severity: engagementTrend < -0.5 ? "high" : "medium",
    });
  }

  return {
    success: true,
    data: { donor, daysSinceContact, engagementTrend },
  };
}
```

---

## 7. Cross-Agent Queries

### 7.1 Agent Query Interface

Agents can query each other's knowledge through Station Pulse:

```typescript
// lib/stationPulse/agentQueries.ts

export const crossAgentQueries = {
  // Sarah can ask: "Which sponsors have ties to donor X?"
  async getDonorSponsorConnections(
    ctx: QueryCtx,
    stationId: Id<"stations">,
    donorId: string
  ) {
    const donor = await ctx.db.get("donors", donorId);
    const sponsors = await ctx.db
      .query("sponsors")
      .withIndex("by_station", q => q.eq("stationId", stationId))
      .collect();

    // Find connections (same company, known relationship, etc.)
    const connections = sponsors.filter(s =>
      s.companyName === donor.employer ||
      s.contacts?.some(c => c.email?.includes(donor.email?.split("@")[1] || ""))
    );

    return connections;
  },

  // Jordan can ask: "What's the donor/sponsor impact of show X?"
  async getShowImpactProfile(
    ctx: QueryCtx,
    stationId: Id<"stations">,
    showId: string
  ) {
    // Get donors who mentioned this show
    const donorMentions = await ctx.db
      .query("donorShowPreferences")
      .withIndex("by_show", q => q.eq("showId", showId))
      .collect();

    // Get sponsors in this daypart
    const show = await ctx.db.get("shows", showId);
    const sponsors = await ctx.db
      .query("sponsorPlacements")
      .withIndex("by_daypart", q => q.eq("daypart", show.daypart))
      .collect();

    // Get grant mentions
    const grantMentions = await ctx.db
      .query("grantCommitments")
      .withIndex("by_show", q => q.eq("showId", showId))
      .collect();

    return {
      donorImpact: {
        count: donorMentions.length,
        totalGiving: donorMentions.reduce((sum, d) => sum + d.totalGiving, 0),
        majorDonorCount: donorMentions.filter(d => d.totalGiving >= 1000).length,
      },
      sponsorImpact: {
        count: sponsors.length,
        totalRevenue: sponsors.reduce((sum, s) => sum + s.contractValue, 0),
      },
      grantImpact: {
        count: grantMentions.length,
        atRisk: grantMentions.filter(g => g.status === "active").length,
      },
    };
  },

  // Diana can ask: "Is this prospect connected to any current donors?"
  async getProspectDonorConnections(
    ctx: QueryCtx,
    stationId: Id<"stations">,
    prospectCompanyName: string
  ) {
    const donors = await ctx.db
      .query("donors")
      .withIndex("by_station", q => q.eq("stationId", stationId))
      .filter(q => q.eq(q.field("employer"), prospectCompanyName))
      .collect();

    return {
      employeeDonors: donors,
      totalDonorGiving: donors.reduce((sum, d) => sum + d.totalGiving, 0),
      recommendation: donors.length > 0
        ? "Leverage employee donor relationships in pitch"
        : null,
    };
  },

  // Marcus can ask: "What content resonates with sustaining members?"
  async getSustainerContentPreferences(
    ctx: QueryCtx,
    stationId: Id<"stations">
  ) {
    // Get sustaining members
    const sustainers = await ctx.db
      .query("donors")
      .withIndex("by_station", q => q.eq("stationId", stationId))
      .filter(q => q.eq(q.field("givingType"), "sustaining"))
      .collect();

    // Aggregate show preferences
    const preferences = await Promise.all(
      sustainers.map(s => ctx.db
        .query("donorShowPreferences")
        .withIndex("by_donor", q => q.eq("donorId", s._id))
        .collect()
      )
    );

    // Count show mentions
    const showCounts: Record<string, number> = {};
    for (const prefs of preferences) {
      for (const pref of prefs) {
        showCounts[pref.showId] = (showCounts[pref.showId] || 0) + 1;
      }
    }

    return Object.entries(showCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  },
};
```

---

## 8. Implementation Plan

### 8.1 Phase 1: Signal Infrastructure (2 weeks)

| Task | Description | Estimate |
|------|-------------|----------|
| Schema updates | Add signals, correlations, briefings tables | 2 days |
| Signal emission API | Create emit signal mutation | 2 days |
| Signal taxonomy | Define all signal types and severity rules | 2 days |
| Agent integration | Add signal emission to existing agent tools | 4 days |

### 8.2 Phase 2: Correlation Engine (2 weeks)

| Task | Description | Estimate |
|------|-------------|----------|
| Collision rules | Implement 5 collision type detectors | 4 days |
| Pattern detection | Build cross-signal pattern matching | 3 days |
| Correlation storage | Store and manage correlations | 2 days |
| Real-time alerts | Push notifications for critical correlations | 1 day |

### 8.3 Phase 3: Briefing System (1 week)

| Task | Description | Estimate |
|------|-------------|----------|
| Briefing generator | Daily briefing creation logic | 2 days |
| Scheduler | Cron job for daily generation | 1 day |
| Delivery | Dashboard display, email option | 2 days |

### 8.4 Phase 4: Cross-Agent Queries (1 week)

| Task | Description | Estimate |
|------|-------------|----------|
| Query interface | Build cross-agent query API | 2 days |
| Agent integration | Enable agents to query other domains | 3 days |

**Total Estimate: 6 weeks**

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// __tests__/stationPulse/collisionDetection.test.ts

describe("Collision Detection", () => {
  describe("Programming ↔ Development", () => {
    it("should detect collision when schedule change affects major donors", async () => {
      // Setup: Create show with associated major donors
      const show = await createTestShow({ name: "Local Rhythms" });
      const donor1 = await createTestDonor({ totalGiving: 5000 });
      const donor2 = await createTestDonor({ totalGiving: 2500 });
      await linkDonorToShow(donor1, show);
      await linkDonorToShow(donor2, show);

      // Action: Emit schedule change signal
      const signal = await emitSignal({
        signalType: "schedule_change_proposed",
        entityId: show._id,
        entityName: show.name,
      });

      // Assert: Collision should be detected
      const correlations = await getCorrelations({ stationId: show.stationId });
      expect(correlations).toHaveLength(1);
      expect(correlations[0].correlationType).toBe("programming_development");
      expect(correlations[0].affectedEntities).toHaveLength(2);
    });

    it("should not detect collision for show with no donor connections", async () => {
      const show = await createTestShow({ name: "Test Show" });

      const signal = await emitSignal({
        signalType: "schedule_change_proposed",
        entityId: show._id,
      });

      const correlations = await getCorrelations({ stationId: show.stationId });
      expect(correlations).toHaveLength(0);
    });
  });
});
```

### 9.2 Integration Tests

```typescript
// __tests__/stationPulse/briefingGeneration.test.ts

describe("Briefing Generation", () => {
  it("should generate daily briefing with priority items", async () => {
    // Setup: Create signals of various severities
    await emitSignal({ severity: "critical", description: "Critical issue" });
    await emitSignal({ severity: "high", description: "High priority" });
    await emitSignal({ severity: "medium", description: "Medium priority" });
    await emitSignal({ severity: "low", description: "Low priority" });

    // Action: Generate briefing
    const briefingId = await generateBriefing({ stationId });
    const briefing = await getBriefing(briefingId);

    // Assert: Priority items should be ordered correctly
    expect(briefing.priorityItems).toHaveLength(3); // Only high+critical
    expect(briefing.priorityItems[0].level).toBe("HIGH");
    expect(briefing.signalsToWatch).toContain("Low priority");
  });
});
```

---

## 10. Monitoring & Observability

### 10.1 Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Signals per hour | Rate of signal emission | < 10 or > 1000 |
| Correlation accuracy | User feedback on correlations | < 70% |
| Briefing delivery rate | Successfully delivered briefings | < 95% |
| Briefing open rate | Users viewing briefings | < 30% |
| Action completion rate | Recommended actions completed | Track trend |

### 10.2 Logging

```typescript
// lib/stationPulse/logging.ts

export const pulseLogger = {
  signalEmitted: (signal: Signal) => {
    console.log("[PULSE] Signal emitted", {
      type: signal.signalType,
      severity: signal.severity,
      agent: signal.sourceAgent,
      stationId: signal.stationId,
    });
  },

  collisionDetected: (collision: Correlation) => {
    console.log("[PULSE] Collision detected", {
      type: collision.correlationType,
      impact: collision.impact,
      affectedCount: collision.affectedEntities.length,
    });
  },

  briefingGenerated: (briefing: Briefing) => {
    console.log("[PULSE] Briefing generated", {
      stationId: briefing.stationId,
      date: briefing.briefingDate,
      priorityItemCount: briefing.priorityItems.length,
    });
  },
};
```

---

## 11. Security Considerations

### 11.1 Data Access Control

- Signals are scoped to stations (multi-tenant isolation)
- Briefings only accessible by station admin/manager roles
- Cross-agent queries respect data boundaries

### 11.2 Signal Validation

```typescript
// All signals must be validated before storage
export function validateSignal(signal: SignalInput): boolean {
  // Check signal type is in taxonomy
  if (!isValidSignalType(signal.signalType)) {
    throw new Error(`Invalid signal type: ${signal.signalType}`);
  }

  // Check severity is valid for this signal type
  if (!isValidSeverity(signal.signalType, signal.severity)) {
    throw new Error(`Invalid severity for ${signal.signalType}`);
  }

  // Check entity exists if entityId provided
  if (signal.entityId && !await entityExists(signal.entityType, signal.entityId)) {
    throw new Error(`Entity not found: ${signal.entityType}/${signal.entityId}`);
  }

  return true;
}
```

---

## 12. Future Considerations

### 12.1 Machine Learning Enhancements

- **Predictive decay detection:** Train model on historical attrition patterns
- **Anomaly detection:** Identify unusual signal patterns automatically
- **Action effectiveness:** Learn which recommended actions get completed

### 12.2 External Signal Sources

- **Industry news:** Monitor public radio news for relevant stories
- **Market data:** Track economic indicators affecting giving
- **Competitive intel:** Monitor competitor activities

### 12.3 Advanced Briefing Features

- **Personalized briefings:** Different briefings for different roles
- **Interactive briefings:** Click to drill down into signals
- **Voice briefings:** Audio summary for busy executives

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 8, 2026 | Tarik Moody | Initial architecture document |

---

*Station Pulse — The Chief of Staff that never sleeps.*
