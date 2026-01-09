import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// MOO-16: Collision Detection Rules
// Detects 5 collision types between departments to flag conflicts early
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type CollisionType =
  | "programming_development"   // Schedule changes affecting major donors
  | "marketing_underwriting"    // Campaign conflicts with sponsor expectations
  | "events_roi"                // Event decisions without revenue visibility
  | "content_membership"        // Programming not aligned with member preferences
  | "grant_reality";            // Reported metrics vs actual performance

interface SignalMatcher {
  type: string;                 // Signal type pattern (e.g., "programming.schedule_change")
  category?: string;            // Category filter
  entityMatch?: string;         // Entity field to match across signals
  severityMin?: string;         // Minimum severity level
}

interface CollisionRule {
  id: CollisionType;
  name: string;
  description: string;
  signals: SignalMatcher[];     // Signals that must co-occur
  timeWindowMs: number;         // Time window for signals to be considered related
  baseSeverity: "high" | "medium" | "low";
  affectedDepartments: string[];
}

interface SignalForCollision {
  _id: Id<"signals">;
  stationId: Id<"stations">;
  type: string;
  category: string;
  sourceAgent: string;
  severity: string;
  title: string;
  entityType?: string;
  entityId?: string;
  createdAt: number;
}

interface CollisionMatch {
  ruleId: CollisionType;
  signalIds: Id<"signals">[];
  severity: "high" | "medium" | "low";
  description: string;
  affectedDepartments: string[];
  entityContext?: {
    type: string;
    id: string;
  };
}

// -----------------------------------------------------------------------------
// Collision Rules Configuration
// -----------------------------------------------------------------------------

const COLLISION_RULES: CollisionRule[] = [
  {
    id: "programming_development",
    name: "Programming ↔ Development Collision",
    description: "Schedule changes may affect major donors with show affinity",
    signals: [
      { type: "programming.schedule_change", category: "programming" },
      { type: "donor.show_affinity", category: "donor", entityMatch: "showId" },
    ],
    timeWindowMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    baseSeverity: "high",
    affectedDepartments: ["programming", "development"],
  },
  {
    id: "marketing_underwriting",
    name: "Marketing ↔ Underwriting Collision",
    description: "Campaign messaging may conflict with sponsor expectations",
    signals: [
      { type: "marketing.campaign_performance", category: "marketing" },
      { type: "sponsor.complaint", category: "sponsor" },
    ],
    timeWindowMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    baseSeverity: "high",
    affectedDepartments: ["marketing", "underwriting"],
  },
  {
    id: "events_roi",
    name: "Events ↔ ROI Collision",
    description: "Event decisions being made without revenue visibility",
    signals: [
      { type: "event.capacity_alert", category: "event" },
      { type: "sponsor.payment_issue", category: "sponsor" },
    ],
    timeWindowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    baseSeverity: "medium",
    affectedDepartments: ["events", "underwriting", "development"],
  },
  {
    id: "content_membership",
    name: "Content ↔ Membership Collision",
    description: "Programming changes not aligned with member preferences",
    signals: [
      { type: "programming.audience_shift", category: "programming" },
      { type: "membership.churn_risk", category: "membership" },
    ],
    timeWindowMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    baseSeverity: "medium",
    affectedDepartments: ["programming", "membership"],
  },
  {
    id: "grant_reality",
    name: "Grant Narrative ↔ Reality Collision",
    description: "Grant reported metrics may not match actual performance",
    signals: [
      { type: "grant.narrative_mismatch", category: "grant" },
      { type: "programming.show_performance", category: "programming" },
    ],
    timeWindowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    baseSeverity: "high",
    affectedDepartments: ["grants", "programming"],
  },
];

// Severity ranking for escalation calculations
const SEVERITY_RANK = {
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
} as const;

// -----------------------------------------------------------------------------
// Internal: Detect Collisions
// -----------------------------------------------------------------------------

export const detect = internalMutation({
  args: {
    stationId: v.id("stations"),
    lookbackMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lookbackMs = args.lookbackMs ?? 30 * 24 * 60 * 60 * 1000; // 30 days default
    const windowStart = now - lookbackMs;

    // Get recent signals within the time window
    const recentSignals = await ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("createdAt"), windowStart))
      .collect();

    if (recentSignals.length < 2) {
      return { collisionsFound: 0, message: "Not enough signals to detect collisions" };
    }

    const collisions: CollisionMatch[] = [];

    // Check each collision rule
    for (const rule of COLLISION_RULES) {
      const matches = detectRuleMatches(recentSignals, rule);
      collisions.push(...matches);
    }

    // Store collisions as correlations with collision type
    let created = 0;
    for (const collision of collisions) {
      // Check if this collision already exists
      const existing = await findExistingCollision(
        ctx,
        args.stationId,
        collision.signalIds
      );

      if (!existing) {
        await ctx.db.insert("signalCorrelations", {
          stationId: args.stationId,
          signalIds: collision.signalIds,
          correlationType: "collision",
          confidence: calculateCollisionConfidence(collision),
          description: collision.description,
          metadata: {
            collisionType: collision.ruleId,
            affectedDepartments: collision.affectedDepartments,
            entityContext: collision.entityContext,
          },
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return {
      collisionsFound: collisions.length,
      collisionsCreated: created,
      signalsAnalyzed: recentSignals.length,
      rulesEvaluated: COLLISION_RULES.length,
    };
  },
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function detectRuleMatches(
  signals: SignalForCollision[],
  rule: CollisionRule
): CollisionMatch[] {
  const matches: CollisionMatch[] = [];

  // Group signals by the rule's signal matchers
  const signalGroups: SignalForCollision[][] = rule.signals.map((matcher) =>
    signals.filter((s) => matchesSignalPattern(s, matcher))
  );

  // If any group is empty, no collision possible
  if (signalGroups.some((group) => group.length === 0)) {
    return matches;
  }

  // Find combinations where signals are within the time window
  // For simplicity, check pairwise for 2-signal rules
  const [group1, group2] = signalGroups;

  for (const s1 of group1) {
    for (const s2 of group2) {
      // Skip if same signal
      if (s1._id === s2._id) continue;

      // Check time window
      const timeDiff = Math.abs(s1.createdAt - s2.createdAt);
      if (timeDiff > rule.timeWindowMs) continue;

      // Check entity match if required
      if (rule.signals.some((m) => m.entityMatch)) {
        const matchField = rule.signals.find((m) => m.entityMatch)?.entityMatch;
        if (matchField && s1.entityId !== s2.entityId) continue;
      }

      // Calculate escalated severity based on signal severities
      const severity = calculateEscalatedSeverity(
        rule.baseSeverity,
        s1.severity,
        s2.severity
      );

      matches.push({
        ruleId: rule.id,
        signalIds: [s1._id, s2._id],
        severity,
        description: `${rule.name}: ${s1.title} + ${s2.title}`,
        affectedDepartments: rule.affectedDepartments,
        entityContext: s1.entityId
          ? { type: s1.entityType || "unknown", id: s1.entityId }
          : undefined,
      });
    }
  }

  return matches;
}

function matchesSignalPattern(
  signal: SignalForCollision,
  matcher: SignalMatcher
): boolean {
  // Check type pattern (supports prefix matching with wildcard)
  if (matcher.type.endsWith("*")) {
    const prefix = matcher.type.slice(0, -1);
    if (!signal.type.startsWith(prefix)) return false;
  } else if (signal.type !== matcher.type) {
    return false;
  }

  // Check category if specified
  if (matcher.category && signal.category !== matcher.category) {
    return false;
  }

  // Check minimum severity if specified
  if (matcher.severityMin) {
    const minRank = SEVERITY_RANK[matcher.severityMin as keyof typeof SEVERITY_RANK] || 0;
    const signalRank = SEVERITY_RANK[signal.severity as keyof typeof SEVERITY_RANK] || 0;
    if (signalRank < minRank) return false;
  }

  return true;
}

function calculateEscalatedSeverity(
  baseSeverity: "high" | "medium" | "low",
  ...signalSeverities: string[]
): "high" | "medium" | "low" {
  const baseRank = SEVERITY_RANK[baseSeverity];

  // If any signal is high severity, escalate the collision
  const maxSignalRank = Math.max(
    ...signalSeverities.map(
      (s) => SEVERITY_RANK[s as keyof typeof SEVERITY_RANK] || 0
    )
  );

  // Combined severity: base + max signal contribution
  const combinedRank = Math.min(3, baseRank + Math.floor(maxSignalRank / 2));

  if (combinedRank >= 3) return "high";
  if (combinedRank >= 2) return "medium";
  return "low";
}

function calculateCollisionConfidence(collision: CollisionMatch): number {
  let confidence = 60; // Base confidence for a collision

  // Higher severity = higher confidence
  if (collision.severity === "high") confidence += 20;
  else if (collision.severity === "medium") confidence += 10;

  // Entity context adds confidence
  if (collision.entityContext) confidence += 15;

  // More affected departments = potentially more impactful
  confidence += Math.min(10, collision.affectedDepartments.length * 3);

  return Math.min(100, confidence);
}

async function findExistingCollision(
  ctx: { db: any },
  stationId: Id<"stations">,
  signalIds: Id<"signals">[]
): Promise<boolean> {
  const sortedIds = [...signalIds].sort();

  const existing = await ctx.db
    .query("signalCorrelations")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .filter((q: any) =>
      q.and(
        q.eq(q.field("correlationType"), "collision"),
        q.eq(q.field("status"), "active")
      )
    )
    .collect();

  for (const corr of existing) {
    const existingSorted = [...corr.signalIds].sort();
    if (
      existingSorted.length === sortedIds.length &&
      existingSorted.every((id: string, i: number) => id === sortedIds[i])
    ) {
      return true;
    }
  }

  return false;
}

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

export const listCollisions = query({
  args: {
    stationId: v.id("stations"),
    status: v.optional(
      v.union(v.literal("active"), v.literal("acknowledged"), v.literal("dismissed"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("signalCorrelations")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.eq(q.field("correlationType"), "collision"))
      .order("desc")
      .collect();

    if (args.status) {
      results = results.filter((c) => c.status === args.status);
    }

    return results.slice(0, args.limit || 50);
  },
});

export const getCollisionById = query({
  args: { collisionId: v.id("signalCorrelations") },
  handler: async (ctx, args) => {
    const collision = await ctx.db.get(args.collisionId);
    if (!collision || collision.correlationType !== "collision") return null;

    // Fetch related signals
    const signals = await Promise.all(
      collision.signalIds.map((id: Id<"signals">) => ctx.db.get(id))
    );

    return {
      ...collision,
      signals: signals.filter(Boolean),
    };
  },
});

export const getActiveCollisionCount = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    const collisions = await ctx.db
      .query("signalCorrelations")
      .withIndex("by_station_status", (q) =>
        q.eq("stationId", args.stationId).eq("status", "active")
      )
      .filter((q) => q.eq(q.field("correlationType"), "collision"))
      .collect();

    return {
      total: collisions.length,
      byType: countByCollisionType(collisions),
    };
  },
});

function countByCollisionType(
  collisions: Array<{ metadata?: any }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of collisions) {
    const type = c.metadata?.collisionType || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export const acknowledgeCollision = mutation({
  args: {
    collisionId: v.id("signalCorrelations"),
    acknowledgedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const collision = await ctx.db.get(args.collisionId);
    if (!collision || collision.correlationType !== "collision") {
      throw new Error("Collision not found");
    }

    await ctx.db.patch(args.collisionId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
      acknowledgedBy: args.acknowledgedBy,
      metadata: {
        ...collision.metadata,
        acknowledgmentNotes: args.notes,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const resolveCollision = mutation({
  args: {
    collisionId: v.id("signalCorrelations"),
    resolution: v.string(),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const collision = await ctx.db.get(args.collisionId);
    if (!collision || collision.correlationType !== "collision") {
      throw new Error("Collision not found");
    }

    await ctx.db.patch(args.collisionId, {
      status: "dismissed", // Using dismissed as "resolved" for collisions
      dismissedAt: Date.now(),
      dismissReason: args.resolution,
      metadata: {
        ...collision.metadata,
        resolvedBy: args.resolvedBy,
        resolutionDate: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const escalateCollision = mutation({
  args: {
    collisionId: v.id("signalCorrelations"),
    escalateTo: v.array(v.string()), // Department heads or specific users
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const collision = await ctx.db.get(args.collisionId);
    if (!collision || collision.correlationType !== "collision") {
      throw new Error("Collision not found");
    }

    await ctx.db.patch(args.collisionId, {
      metadata: {
        ...collision.metadata,
        escalated: true,
        escalatedTo: args.escalateTo,
        escalationReason: args.reason,
        escalatedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// -----------------------------------------------------------------------------
// Trigger: Run collision detection
// -----------------------------------------------------------------------------

export const runDetection = mutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    // This would typically be called by a scheduled job
    // For now, expose as a mutation for testing
    const result = await ctx.runMutation(
      // @ts-ignore - internal mutation
      "collisions:detect" as any,
      { stationId: args.stationId }
    );
    return result;
  },
});

// -----------------------------------------------------------------------------
// Get Available Collision Rules (for configuration UI)
// -----------------------------------------------------------------------------

export const getCollisionRules = query({
  args: {},
  handler: async () => {
    return COLLISION_RULES.map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      baseSeverity: rule.baseSeverity,
      affectedDepartments: rule.affectedDepartments,
      timeWindowDays: rule.timeWindowMs / (24 * 60 * 60 * 1000),
    }));
  },
});
