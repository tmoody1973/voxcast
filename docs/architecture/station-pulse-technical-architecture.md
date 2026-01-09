# Station Pulse - Technical Architecture Document

**Version:** 1.0
**Author:** BMAD Architect Agent
**Date:** January 8, 2026
**Status:** Draft

---

## 1. Executive Summary

Station Pulse is the intelligence orchestration layer for Voxcast, functioning as a "Chief of Staff" that correlates signals across the four specialized agents (Sarah, Marcus, Diana, Jordan) to provide proactive early warning and cross-department visibility to station leadership.

### Core Capabilities
1. **Daily Briefing** - Prioritized intelligence with recommended actions
2. **Multi-Signal Correlation** - Connect signals across departments
3. **Collision Detection** - Flag cross-department conflicts
4. **Momentum Tracking** - Identify trends and patterns
5. **Decay Detection** - Surface relationship erosion early
6. **External Intelligence** - Industry news and competitive moves

---

## 2. Architecture Overview

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STATION PULSE                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Orchestration Layer                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │    │
│  │  │ Signal       │  │ Correlation  │  │ Briefing     │       │    │
│  │  │ Aggregator   │─▶│ Engine       │─▶│ Generator    │       │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │    │
│  │         │                  │                  │              │    │
│  │         ▼                  ▼                  ▼              │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │              Shared Knowledge Graph                   │   │    │
│  │  │  (Signals, Entities, Relationships, Patterns)        │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
         │                   │                   │                │
         ▼                   ▼                   ▼                ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐    ┌──────────┐
   │  SARAH   │        │  MARCUS  │        │  DIANA   │    │  JORDAN  │
   │ (Dev)    │        │ (Mktg)   │        │ (Under)  │    │ (Prog)   │
   └──────────┘        └──────────┘        └──────────┘    └──────────┘
         │                   │                   │                │
         └───────────────────┴───────────────────┴────────────────┘
                                    │
                            ┌───────────────┐
                            │   Convex DB   │
                            └───────────────┘
```

### 2.2 Key Design Principles

1. **Signal-Driven Architecture** - All agent activities emit signals to the knowledge graph
2. **Eventual Consistency** - Correlations computed asynchronously via scheduled functions
3. **Agent Independence** - Agents can operate without Station Pulse; it enhances, not blocks
4. **Multi-Tenant Isolation** - All data scoped by `stationId`

---

## 3. Signal Taxonomy

### 3.1 Signal Categories

| Category | Source Agent | Signal Types |
|----------|--------------|--------------|
| `donor` | Sarah | engagement, gift, lapse_risk, event_attendance |
| `sponsor` | Diana | renewal, silence, contract_change, satisfaction |
| `audience` | Marcus | growth, decline, engagement, channel_performance |
| `content` | Jordan | schedule_change, show_performance, partnership |
| `cross_dept` | Station Pulse | collision, momentum, decay |

### 3.2 Signal Schema

```typescript
// convex/schema.ts - Signal Table

signals: defineTable({
  stationId: v.id("stations"),

  // Signal identification
  type: v.string(),                    // e.g., "donor.lapse_risk"
  category: v.union(
    v.literal("donor"),
    v.literal("sponsor"),
    v.literal("audience"),
    v.literal("content"),
    v.literal("cross_dept")
  ),
  sourceAgent: v.union(
    v.literal("sarah"),
    v.literal("marcus"),
    v.literal("diana"),
    v.literal("jordan"),
    v.literal("pulse")
  ),

  // Signal data
  severity: v.union(
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
    v.literal("info")
  ),
  title: v.string(),
  description: v.string(),

  // Entity references (what this signal is about)
  entityType: v.optional(v.string()),   // "donor", "sponsor", "show", etc.
  entityId: v.optional(v.string()),     // External ID or internal reference
  entityName: v.optional(v.string()),   // Human-readable name

  // Correlation data
  relatedSignals: v.optional(v.array(v.id("signals"))),
  correlationScore: v.optional(v.float64()),

  // Recommendations
  recommendedAction: v.optional(v.string()),
  assignedAgent: v.optional(v.string()),

  // Status
  status: v.union(
    v.literal("new"),
    v.literal("acknowledged"),
    v.literal("acted_upon"),
    v.literal("dismissed"),
    v.literal("expired")
  ),
  expiresAt: v.optional(v.number()),

  // Metadata
  metadata: v.optional(v.any()),

  // Timestamps
  createdAt: v.number(),
  acknowledgedAt: v.optional(v.number()),
})
.index("by_station", ["stationId"])
.index("by_station_category", ["stationId", "category"])
.index("by_station_status", ["stationId", "status"])
.index("by_station_severity", ["stationId", "severity", "createdAt"])
.index("by_entity", ["stationId", "entityType", "entityId"])
```

### 3.3 Signal Emission Examples

```typescript
// convex/signals/emit.ts

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Called by agents when they detect noteworthy events
export const emitSignal = mutation({
  args: {
    stationId: v.id("stations"),
    type: v.string(),
    category: v.string(),
    sourceAgent: v.string(),
    severity: v.string(),
    title: v.string(),
    description: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityName: v.optional(v.string()),
    recommendedAction: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const signalId = await ctx.db.insert("signals", {
      ...args,
      status: "new",
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Trigger correlation check
    await ctx.scheduler.runAfter(0, internal.signals.checkCorrelations, {
      signalId,
      stationId: args.stationId,
    });

    return signalId;
  },
});
```

---

## 4. Correlation Engine

### 4.1 Correlation Rules

The correlation engine detects patterns across signals. Core rules:

```typescript
// convex/pulse/correlationRules.ts

export const CORRELATION_RULES: CorrelationRule[] = [
  // Programming ↔ Development Collision
  {
    id: "prog_dev_collision",
    name: "Programming Decision Affects Donors",
    description: "Schedule change impacts donors who cite that show",
    triggerSignal: "content.schedule_change",
    matchSignals: ["donor.show_preference"],
    matchWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
    minMatches: 1,
    outputSeverity: "high",
    outputType: "cross_dept.collision",
    outputTemplate: "{{triggerCount}} donors cite {{showName}} - schedule change under consideration",
  },

  // Marketing ↔ Underwriting Collision
  {
    id: "mktg_under_collision",
    name: "Campaign Timing vs Sponsor Sensitivity",
    description: "Marketing campaign conflicts with sponsor relationship",
    triggerSignal: "audience.campaign_launch",
    matchSignals: ["sponsor.sensitivity_flag"],
    matchWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
    minMatches: 1,
    outputSeverity: "medium",
    outputType: "cross_dept.collision",
  },

  // Multi-Signal Decay Pattern
  {
    id: "relationship_decay",
    name: "Relationship Erosion Pattern",
    description: "Multiple decay signals indicate systemic issue",
    triggerSignal: "donor.engagement_drop",
    matchSignals: ["donor.engagement_drop", "donor.event_absence"],
    matchWindow: 90 * 24 * 60 * 60 * 1000, // 90 days
    minMatches: 3,
    outputSeverity: "high",
    outputType: "cross_dept.decay_pattern",
    outputTemplate: "{{matchCount}} donors showing disengagement pattern",
  },

  // Momentum Detection
  {
    id: "positive_momentum",
    name: "Positive Momentum Detected",
    description: "Multiple positive signals in same area",
    triggerSignal: "audience.growth",
    matchSignals: ["audience.growth", "donor.new_member", "sponsor.new_contract"],
    matchWindow: 14 * 24 * 60 * 60 * 1000, // 14 days
    minMatches: 3,
    outputSeverity: "info",
    outputType: "cross_dept.momentum_positive",
  },
];
```

### 4.2 Correlation Processor

```typescript
// convex/pulse/correlationEngine.ts

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { CORRELATION_RULES } from "./correlationRules";

export const checkCorrelations = internalMutation({
  args: {
    signalId: v.id("signals"),
    stationId: v.id("stations"),
  },
  handler: async (ctx, { signalId, stationId }) => {
    const triggerSignal = await ctx.db.get(signalId);
    if (!triggerSignal) return;

    // Find applicable rules
    const applicableRules = CORRELATION_RULES.filter(
      rule => triggerSignal.type === rule.triggerSignal ||
              triggerSignal.type.startsWith(rule.triggerSignal.split('.')[0])
    );

    for (const rule of applicableRules) {
      // Query for matching signals within window
      const windowStart = Date.now() - rule.matchWindow;

      const matchingSignals = await ctx.db
        .query("signals")
        .withIndex("by_station", (q) => q.eq("stationId", stationId))
        .filter((q) =>
          q.and(
            q.gte(q.field("createdAt"), windowStart),
            q.neq(q.field("_id"), signalId)
          )
        )
        .collect();

      // Filter by match criteria
      const matches = matchingSignals.filter(s =>
        rule.matchSignals.some(pattern => s.type.includes(pattern)) &&
        (rule.entityMatch ? s.entityId === triggerSignal.entityId : true)
      );

      if (matches.length >= rule.minMatches) {
        // Emit correlation signal
        await ctx.db.insert("signals", {
          stationId,
          type: rule.outputType,
          category: "cross_dept",
          sourceAgent: "pulse",
          severity: rule.outputSeverity,
          title: rule.name,
          description: rule.outputTemplate
            ?.replace("{{matchCount}}", String(matches.length))
            ?.replace("{{triggerCount}}", String(matches.length))
            || rule.description,
          relatedSignals: [signalId, ...matches.map(m => m._id)],
          correlationScore: matches.length / rule.minMatches,
          status: "new",
          createdAt: Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        });
      }
    }
  },
});
```

---

## 5. Daily Briefing Generator

### 5.1 Cron Job Configuration

```typescript
// convex/crons.ts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Generate daily briefings at 7:00 AM UTC (adjustable per station timezone)
crons.daily(
  "generate-daily-briefings",
  { hourUTC: 7, minuteUTC: 0 },
  internal.pulse.generateAllBriefings
);

// Run hourly correlation sweep for real-time detection
crons.interval(
  "correlation-sweep",
  { hours: 1 },
  internal.pulse.runCorrelationSweep
);

// Expire old signals weekly
crons.weekly(
  "expire-old-signals",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.signals.expireOldSignals
);

export default crons;
```

### 5.2 Briefing Generator

```typescript
// convex/pulse/briefingGenerator.ts

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Briefing table schema
// Add to schema.ts:
/*
briefings: defineTable({
  stationId: v.id("stations"),
  generatedAt: v.number(),

  // Briefing content
  priorityItems: v.array(v.object({
    level: v.union(v.literal("HIGH"), v.literal("MEDIUM"), v.literal("LOW")),
    category: v.string(),
    summary: v.string(),
    context: v.string(),
    recommendedAction: v.string(),
    owner: v.string(),
    signalIds: v.array(v.id("signals")),
  })),

  signalsToWatch: v.array(v.object({
    description: v.string(),
    daysSince: v.optional(v.number()),
    signalId: v.optional(v.id("signals")),
  })),

  crossDepartmentActivity: v.array(v.object({
    agent: v.string(),
    summary: v.string(),
  })),

  // Metadata
  signalCount: v.number(),
  collisionCount: v.number(),

  // Status
  status: v.union(
    v.literal("generated"),
    v.literal("viewed"),
    v.literal("archived")
  ),
  viewedAt: v.optional(v.number()),
})
.index("by_station", ["stationId"])
.index("by_station_date", ["stationId", "generatedAt"])
*/

export const generateBriefing = internalMutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    // Get all new/unacknowledged signals from last 24 hours
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);

    const recentSignals = await ctx.db
      .query("signals")
      .withIndex("by_station_status", (q) =>
        q.eq("stationId", stationId).eq("status", "new")
      )
      .filter((q) => q.gte(q.field("createdAt"), yesterday))
      .collect();

    // Categorize and prioritize
    const highPriority = recentSignals.filter(s => s.severity === "high");
    const mediumPriority = recentSignals.filter(s => s.severity === "medium");
    const lowPriority = recentSignals.filter(s => s.severity === "low");

    // Build priority items
    const priorityItems = [
      ...highPriority.map(s => ({
        level: "HIGH" as const,
        category: s.type,
        summary: s.title,
        context: s.description,
        recommendedAction: s.recommendedAction || "Review and take action",
        owner: s.assignedAgent || mapCategoryToAgent(s.category),
        signalIds: [s._id],
      })),
      ...mediumPriority.slice(0, 5).map(s => ({
        level: "MEDIUM" as const,
        category: s.type,
        summary: s.title,
        context: s.description,
        recommendedAction: s.recommendedAction || "Monitor and consider action",
        owner: s.assignedAgent || mapCategoryToAgent(s.category),
        signalIds: [s._id],
      })),
      ...lowPriority.slice(0, 3).map(s => ({
        level: "LOW" as const,
        category: s.type,
        summary: s.title,
        context: s.description,
        recommendedAction: s.recommendedAction || "Note for awareness",
        owner: s.assignedAgent || mapCategoryToAgent(s.category),
        signalIds: [s._id],
      })),
    ];

    // Build signals to watch (aging signals that need attention)
    const signalsToWatch = await getAgingSignals(ctx, stationId);

    // Build cross-department activity summary
    const crossDeptActivity = await getCrossDeptSummary(ctx, stationId);

    // Count collisions
    const collisionCount = recentSignals.filter(
      s => s.type.includes("collision")
    ).length;

    // Create briefing
    const briefingId = await ctx.db.insert("briefings", {
      stationId,
      generatedAt: Date.now(),
      priorityItems,
      signalsToWatch,
      crossDepartmentActivity: crossDeptActivity,
      signalCount: recentSignals.length,
      collisionCount,
      status: "generated",
    });

    return briefingId;
  },
});

function mapCategoryToAgent(category: string): string {
  const mapping: Record<string, string> = {
    donor: "sarah",
    sponsor: "diana",
    audience: "marcus",
    content: "jordan",
    cross_dept: "pulse",
  };
  return mapping[category] || "pulse";
}

async function getAgingSignals(ctx: any, stationId: string) {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  const agingSignals = await ctx.db
    .query("signals")
    .withIndex("by_station_status", (q) =>
      q.eq("stationId", stationId).eq("status", "new")
    )
    .filter((q) => q.lte(q.field("createdAt"), weekAgo))
    .take(5);

  return agingSignals.map((s: any) => ({
    description: s.title,
    daysSince: Math.floor((Date.now() - s.createdAt) / (24 * 60 * 60 * 1000)),
    signalId: s._id,
  }));
}

async function getCrossDeptSummary(ctx: any, stationId: string) {
  // Get recent activity per agent
  const agents = ["sarah", "marcus", "diana", "jordan"];
  const summaries = [];

  for (const agent of agents) {
    const recentSignals = await ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", stationId))
      .filter((q) => q.eq(q.field("sourceAgent"), agent))
      .order("desc")
      .take(3);

    if (recentSignals.length > 0) {
      summaries.push({
        agent,
        summary: recentSignals.map((s: any) => s.title).join(". ") + ".",
      });
    }
  }

  return summaries;
}
```

---

## 6. Knowledge Graph Schema

### 6.1 Entity Tables

```typescript
// convex/schema.ts - Knowledge Graph Entities

// People (donors, sponsors, hosts, board members)
entities: defineTable({
  stationId: v.id("stations"),

  // Entity identification
  type: v.union(
    v.literal("donor"),
    v.literal("sponsor"),
    v.literal("host"),
    v.literal("board_member"),
    v.literal("partner"),
    v.literal("prospect")
  ),
  externalId: v.optional(v.string()),  // CRM ID, etc.

  // Core data
  name: v.string(),
  email: v.optional(v.string()),
  organization: v.optional(v.string()),

  // Relationship scores (computed)
  engagementScore: v.optional(v.float64()),      // 0-100
  momentumScore: v.optional(v.float64()),        // -100 to +100
  riskScore: v.optional(v.float64()),            // 0-100
  lastInteractionAt: v.optional(v.number()),

  // Preferences and interests
  interests: v.optional(v.array(v.string())),    // Shows, topics, etc.
  preferences: v.optional(v.any()),

  // Metadata
  metadata: v.optional(v.any()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_station", ["stationId"])
.index("by_station_type", ["stationId", "type"])
.index("by_external_id", ["stationId", "externalId"])

// Relationships between entities
entityRelationships: defineTable({
  stationId: v.id("stations"),

  // Relationship
  fromEntityId: v.id("entities"),
  toEntityId: v.id("entities"),
  relationshipType: v.string(),  // "spouse_of", "works_at", "board_of", etc.

  // Strength and metadata
  strength: v.optional(v.float64()),  // 0-100
  notes: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
})
.index("by_from", ["fromEntityId"])
.index("by_to", ["toEntityId"])
.index("by_station", ["stationId"])

// Interactions (touchpoints with entities)
interactions: defineTable({
  stationId: v.id("stations"),
  entityId: v.id("entities"),

  // Interaction details
  type: v.union(
    v.literal("meeting"),
    v.literal("call"),
    v.literal("email"),
    v.literal("event"),
    v.literal("gift"),
    v.literal("renewal"),
    v.literal("broadcast_mention")
  ),
  description: v.string(),
  outcome: v.optional(v.string()),

  // Attribution
  agentId: v.optional(v.string()),   // Which agent recorded this
  userId: v.optional(v.id("users")), // Which user was involved

  // Timestamps
  occurredAt: v.number(),
  createdAt: v.number(),
})
.index("by_entity", ["entityId"])
.index("by_station", ["stationId"])
.index("by_station_type", ["stationId", "type"])
```

### 6.2 Content Entities

```typescript
// Shows and programming
shows: defineTable({
  stationId: v.id("stations"),

  // Show identification
  name: v.string(),
  slug: v.string(),

  // Schedule
  dayparts: v.array(v.string()),      // "morning_drive", "midday", etc.
  schedule: v.optional(v.any()),       // Detailed schedule object

  // Performance metrics
  aqh: v.optional(v.number()),         // Average Quarter Hour
  cume: v.optional(v.number()),        // Cumulative audience
  tsl: v.optional(v.number()),         // Time Spent Listening

  // Relationships
  hostIds: v.optional(v.array(v.id("entities"))),
  sponsorIds: v.optional(v.array(v.id("entities"))),

  // Strategic classification
  outcomeType: v.optional(v.union(
    v.literal("reach"),        // Brings people in
    v.literal("retention"),    // Keeps people engaged
    v.literal("conversion"),   // Drives membership/giving
    v.literal("brand"),        // Station identity
    v.literal("revenue")       // Sponsorship driver
  )),

  // Risk factors
  donorDependency: v.optional(v.number()),   // How many donors cite this show
  sponsorDependency: v.optional(v.number()), // Revenue tied to this show

  // Status
  status: v.union(
    v.literal("active"),
    v.literal("under_review"),
    v.literal("discontinued")
  ),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_station", ["stationId"])
.index("by_status", ["stationId", "status"])
```

---

## 7. Agent Integration

### 7.1 Signal Emission from Agents

Each agent emits signals during their operations:

```typescript
// Example: Sarah (Development) agent signal emission

// In agent tool handler
async function handleAnalyzeDonorData(
  input: { donorId: string },
  context: AgentContext
): Promise<ToolResult> {
  const donor = await getDonor(input.donorId);

  // Analyze engagement
  const lastInteraction = donor.lastInteractionAt;
  const daysSinceContact = (Date.now() - lastInteraction) / (24 * 60 * 60 * 1000);

  // Emit signal if at risk
  if (daysSinceContact > 30 && donor.givingLevel === "major") {
    await emitSignal({
      stationId: context.stationId,
      type: "donor.lapse_risk",
      category: "donor",
      sourceAgent: "sarah",
      severity: daysSinceContact > 60 ? "high" : "medium",
      title: `${donor.name} hasn't been contacted in ${Math.floor(daysSinceContact)} days`,
      description: `Major donor (${donor.givingLevel}) showing engagement decay`,
      entityType: "donor",
      entityId: donor.externalId,
      entityName: donor.name,
      recommendedAction: "Schedule personal outreach within 7 days",
      metadata: {
        lastGift: donor.lastGiftAmount,
        totalGiving: donor.lifetimeGiving,
        interests: donor.interests,
      },
    });
  }

  return { success: true, data: donor };
}
```

### 7.2 Context Injection for Agents

Station Pulse injects relevant context into agent responses:

```typescript
// convex/pulse/contextInjector.ts

export async function getAgentContext(
  ctx: QueryCtx,
  stationId: string,
  agentId: string
): Promise<AgentContextEnhancement> {
  // Get relevant active signals for this agent
  const relevantSignals = await ctx.db
    .query("signals")
    .withIndex("by_station_status", (q) =>
      q.eq("stationId", stationId).eq("status", "new")
    )
    .filter((q) =>
      q.or(
        q.eq(q.field("assignedAgent"), agentId),
        q.eq(q.field("sourceAgent"), agentId)
      )
    )
    .take(5);

  // Get active collisions affecting this agent
  const collisions = await ctx.db
    .query("signals")
    .withIndex("by_station_category", (q) =>
      q.eq("stationId", stationId).eq("category", "cross_dept")
    )
    .filter((q) => q.eq(q.field("status"), "new"))
    .take(3);

  // Get today's briefing
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const briefing = await ctx.db
    .query("briefings")
    .withIndex("by_station_date", (q) =>
      q.eq("stationId", stationId).gte("generatedAt", todayStart)
    )
    .first();

  return {
    activeSignals: relevantSignals,
    activeCollisions: collisions,
    briefingHighlights: briefing?.priorityItems.slice(0, 3) || [],
    contextPrefix: buildContextPrefix(relevantSignals, collisions),
  };
}

function buildContextPrefix(signals: any[], collisions: any[]): string {
  if (signals.length === 0 && collisions.length === 0) {
    return "";
  }

  let prefix = "\n\n---\n**Station Pulse Context:**\n";

  if (collisions.length > 0) {
    prefix += `\n⚠️ **Active Collisions:** ${collisions.map(c => c.title).join("; ")}`;
  }

  if (signals.length > 0) {
    prefix += `\n📊 **Signals to Consider:** ${signals.map(s => s.title).join("; ")}`;
  }

  prefix += "\n---\n\n";

  return prefix;
}
```

---

## 8. Five Collision Types Implementation

### 8.1 Collision Detection Rules

```typescript
// convex/pulse/collisionDetectors.ts

export const COLLISION_DETECTORS = {
  // 1. Programming ↔ Development
  programmingDevelopment: {
    trigger: "content.schedule_change",
    check: async (ctx: any, signal: any, stationId: string) => {
      // Get the show being changed
      const showId = signal.metadata?.showId;
      if (!showId) return null;

      // Find donors who cite this show
      const affectedDonors = await ctx.db
        .query("entities")
        .withIndex("by_station_type", (q) =>
          q.eq("stationId", stationId).eq("type", "donor")
        )
        .filter((q) =>
          q.includes(q.field("interests"), showId)
        )
        .collect();

      if (affectedDonors.length === 0) return null;

      // Calculate total giving at risk
      const totalAtRisk = affectedDonors.reduce(
        (sum, d) => sum + (d.metadata?.annualGiving || 0), 0
      );

      return {
        type: "cross_dept.collision.prog_dev",
        severity: totalAtRisk > 10000 ? "high" : "medium",
        title: `Schedule change affects ${affectedDonors.length} donors`,
        description: `$${totalAtRisk.toLocaleString()} in annual giving connected to ${signal.entityName}`,
        recommendedAction: "Review Consequence Preview before finalizing decision",
        metadata: {
          affectedDonorCount: affectedDonors.length,
          totalAtRisk,
          donorNames: affectedDonors.slice(0, 5).map(d => d.name),
        },
      };
    },
  },

  // 2. Marketing ↔ Underwriting
  marketingUnderwriting: {
    trigger: "audience.campaign_launch",
    check: async (ctx: any, signal: any, stationId: string) => {
      // Check for sponsor sensitivities
      const sponsors = await ctx.db
        .query("entities")
        .withIndex("by_station_type", (q) =>
          q.eq("stationId", stationId).eq("type", "sponsor")
        )
        .collect();

      const campaignTopics = signal.metadata?.topics || [];

      const conflictingSponsors = sponsors.filter(s =>
        s.metadata?.sensitivities?.some((sens: string) =>
          campaignTopics.some((topic: string) =>
            topic.toLowerCase().includes(sens.toLowerCase())
          )
        )
      );

      if (conflictingSponsors.length === 0) return null;

      return {
        type: "cross_dept.collision.mktg_under",
        severity: "medium",
        title: `Campaign may conflict with ${conflictingSponsors.length} sponsor(s)`,
        description: `Review messaging before launch`,
        metadata: {
          sponsors: conflictingSponsors.map(s => s.name),
        },
      };
    },
  },

  // 3. Events ↔ ROI
  eventsROI: {
    trigger: "donor.event_completed",
    check: async (ctx: any, signal: any, stationId: string) => {
      const eventId = signal.metadata?.eventId;
      const eventCost = signal.metadata?.cost || 0;
      const revenue = signal.metadata?.revenue || 0;
      const roi = eventCost > 0 ? ((revenue - eventCost) / eventCost) * 100 : 0;

      if (roi < 50) {
        return {
          type: "cross_dept.collision.events_roi",
          severity: roi < 0 ? "high" : "medium",
          title: `Event ROI below threshold: ${roi.toFixed(0)}%`,
          description: `${signal.entityName} cost $${eventCost} with $${revenue} return`,
          recommendedAction: "Review event strategy for next year",
        };
      }

      return null;
    },
  },

  // 4. Content ↔ Membership
  contentMembership: {
    trigger: "content.show_cancelled",
    check: async (ctx: any, signal: any, stationId: string) => {
      // Similar to prog_dev but focused on membership correlation
      const showId = signal.metadata?.showId;

      // Get members who joined citing this show
      const affectedMembers = await ctx.db
        .query("interactions")
        .withIndex("by_station_type", (q) =>
          q.eq("stationId", stationId).eq("type", "membership_join")
        )
        .filter((q) =>
          q.eq(q.field("metadata.sourceShow"), showId)
        )
        .collect();

      if (affectedMembers.length < 10) return null;

      return {
        type: "cross_dept.collision.content_membership",
        severity: "high",
        title: `${affectedMembers.length} members joined because of ${signal.entityName}`,
        description: "Cancellation may trigger membership churn",
        recommendedAction: "Plan retention outreach before announcement",
      };
    },
  },

  // 5. Grant Narrative ↔ Reality
  grantNarrative: {
    trigger: "content.program_drift",
    check: async (ctx: any, signal: any, stationId: string) => {
      // Check active grants for narrative alignment
      const activeGrants = await ctx.db
        .query("documents")
        .withIndex("by_station_category", (q) =>
          q.eq("stationId", stationId).eq("category", "grants")
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      // This would require NLP to detect drift - simplified for now
      const programArea = signal.metadata?.programArea;

      const relatedGrants = activeGrants.filter(g =>
        g.metadata?.programAreas?.includes(programArea)
      );

      if (relatedGrants.length === 0) return null;

      return {
        type: "cross_dept.collision.grant_narrative",
        severity: "high",
        title: `Program changes may affect ${relatedGrants.length} active grant(s)`,
        description: `${programArea} changes need grant compliance review`,
        recommendedAction: "Review grant deliverables and reporting requirements",
      };
    },
  },
};
```

---

## 9. API Endpoints

### 9.1 Briefing Endpoints

```typescript
// convex/pulse/queries.ts

export const getTodaysBriefing = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, { stationId }) => {
    const todayStart = new Date().setHours(0, 0, 0, 0);

    return await ctx.db
      .query("briefings")
      .withIndex("by_station_date", (q) =>
        q.eq("stationId", stationId).gte("generatedAt", todayStart)
      )
      .order("desc")
      .first();
  },
});

export const getSignalDashboard = query({
  args: {
    stationId: v.id("stations"),
    category: v.optional(v.string()),
    severity: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { stationId, category, severity, limit = 50 }) => {
    let query = ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", stationId));

    if (category) {
      query = query.filter((q) => q.eq(q.field("category"), category));
    }
    if (severity) {
      query = query.filter((q) => q.eq(q.field("severity"), severity));
    }

    return await query.order("desc").take(limit);
  },
});

export const getCollisions = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, { stationId }) => {
    return await ctx.db
      .query("signals")
      .withIndex("by_station_category", (q) =>
        q.eq("stationId", stationId).eq("category", "cross_dept")
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "new"),
          q.includes(q.field("type"), "collision")
        )
      )
      .order("desc")
      .take(20);
  },
});
```

### 9.2 Signal Management

```typescript
// convex/signals/mutations.ts

export const acknowledgeSignal = mutation({
  args: {
    signalId: v.id("signals"),
  },
  handler: async (ctx, { signalId }) => {
    await ctx.db.patch(signalId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
    });
  },
});

export const dismissSignal = mutation({
  args: {
    signalId: v.id("signals"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { signalId, reason }) => {
    await ctx.db.patch(signalId, {
      status: "dismissed",
      metadata: { dismissReason: reason },
    });
  },
});

export const markActedUpon = mutation({
  args: {
    signalId: v.id("signals"),
    actionTaken: v.string(),
  },
  handler: async (ctx, { signalId, actionTaken }) => {
    await ctx.db.patch(signalId, {
      status: "acted_upon",
      metadata: { actionTaken },
    });
  },
});
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create signal schema and basic tables
- [ ] Implement `emitSignal` mutation
- [ ] Add signal indexes
- [ ] Create basic signal dashboard query

### Phase 2: Correlation Engine (Weeks 3-4)
- [ ] Define correlation rules
- [ ] Implement correlation processor
- [ ] Add collision detection for 5 types
- [ ] Create correlation testing harness

### Phase 3: Daily Briefing (Week 5)
- [ ] Create briefing schema
- [ ] Implement cron job
- [ ] Build briefing generator
- [ ] Add briefing API endpoints

### Phase 4: Knowledge Graph (Weeks 6-7)
- [ ] Create entity schema
- [ ] Implement relationship tracking
- [ ] Add interaction logging
- [ ] Build entity scoring functions

### Phase 5: Agent Integration (Week 8)
- [ ] Add signal emission to agent tools
- [ ] Implement context injection
- [ ] Create agent-specific queries
- [ ] Test cross-agent correlation

### Phase 6: UI & Polish (Weeks 9-10)
- [ ] Build Station Pulse dashboard
- [ ] Create briefing view component
- [ ] Add signal management UI
- [ ] Implement notification system

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// Test correlation rules
describe("CorrelationEngine", () => {
  it("detects programming-development collision", async () => {
    // Create a schedule change signal
    const scheduleSignal = await emitSignal({
      type: "content.schedule_change",
      entityId: "show-123",
      entityName: "Morning Jazz",
    });

    // Create donor preference signals
    await emitSignal({
      type: "donor.show_preference",
      entityId: "donor-456",
      metadata: { showId: "show-123" },
    });

    // Run correlation
    await checkCorrelations({ signalId: scheduleSignal });

    // Verify collision was detected
    const collisions = await getCollisions({ stationId });
    expect(collisions).toHaveLength(1);
    expect(collisions[0].type).toBe("cross_dept.collision.prog_dev");
  });
});
```

### 11.2 Integration Tests

- Test end-to-end signal flow from agent to briefing
- Test cron job execution
- Test signal expiration

---

## 12. Appendix

### A. Signal Type Reference

| Signal Type | Category | Severity | Description |
|------------|----------|----------|-------------|
| `donor.lapse_risk` | donor | high/medium | Donor at risk of lapsing |
| `donor.engagement_drop` | donor | medium | Engagement score decreased |
| `donor.event_absence` | donor | low | Missed expected event |
| `sponsor.renewal_due` | sponsor | medium | Contract renewal approaching |
| `sponsor.silence` | sponsor | medium | No communication in X days |
| `audience.growth` | audience | info | Positive audience trend |
| `audience.decline` | audience | medium | Negative audience trend |
| `content.schedule_change` | content | medium | Programming change proposed |
| `content.show_performance` | content | info | Show metrics update |
| `cross_dept.collision` | cross_dept | high | Cross-department conflict |
| `cross_dept.momentum` | cross_dept | info | Trend detected |
| `cross_dept.decay_pattern` | cross_dept | high | Systemic decay detected |

### B. Environment Variables

```bash
# Convex (auto-configured)
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Station Pulse Configuration
PULSE_CORRELATION_WINDOW_DAYS=30
PULSE_BRIEFING_HOUR_UTC=7
PULSE_SIGNAL_EXPIRY_DAYS=7
PULSE_MIN_CORRELATION_SCORE=0.5
```

---

*Document generated by BMAD Architect Agent for Voxcast Station Pulse implementation.*
