import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// MOO-15: Correlation Engine Core
// Detects patterns across multiple signals to surface meaningful correlations
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type CorrelationType = "temporal" | "entity" | "category" | "collision";

interface SignalForCorrelation {
  _id: Id<"signals">;
  stationId: Id<"stations">;
  type: string;
  category: string;
  sourceAgent: string;
  severity: string;
  entityType?: string;
  entityId?: string;
  createdAt: number;
}

interface CorrelationMatch {
  signalIds: Id<"signals">[];
  type: CorrelationType;
  confidence: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const CORRELATION_CONFIG = {
  // Temporal: signals within this window (24 hours)
  temporalWindowMs: 24 * 60 * 60 * 1000,

  // Minimum signals to form a correlation
  minSignalsForCorrelation: 2,

  // Confidence thresholds
  confidenceWeights: {
    temporal: 20,      // Base for being in same time window
    sameEntity: 40,    // Same entity referenced
    differentAgents: 20, // From different source agents
    categoryMatch: 15,  // Related categories
    severityMatch: 5,   // Same severity level
  },

  // Category intersection patterns (which categories often correlate)
  categoryIntersections: [
    ["donor", "programming"],     // Donor affected by programming changes
    ["sponsor", "programming"],   // Sponsor affected by programming changes
    ["donor", "event"],           // Donor engagement at events
    ["sponsor", "marketing"],     // Sponsor/marketing alignment
    ["membership", "programming"], // Member preferences vs content
  ] as const,
};

// -----------------------------------------------------------------------------
// Internal: Detect Correlations
// -----------------------------------------------------------------------------

export const detect = internalMutation({
  args: {
    stationId: v.id("stations"),
    lookbackMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lookbackMs = args.lookbackMs ?? CORRELATION_CONFIG.temporalWindowMs;
    const windowStart = now - lookbackMs;

    // Get recent signals within the time window
    const recentSignals = await ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("createdAt"), windowStart))
      .collect();

    if (recentSignals.length < CORRELATION_CONFIG.minSignalsForCorrelation) {
      return { correlationsFound: 0, message: "Not enough signals to correlate" };
    }

    const correlations: CorrelationMatch[] = [];

    // 1. Temporal + Entity Overlap Detection
    const entityGroups = groupSignalsByEntity(recentSignals);
    for (const [entityKey, signals] of Object.entries(entityGroups)) {
      if (signals.length >= CORRELATION_CONFIG.minSignalsForCorrelation) {
        const correlation = calculateEntityCorrelation(signals, entityKey);
        if (correlation.confidence >= 50) {
          correlations.push(correlation);
        }
      }
    }

    // 2. Category Intersection Detection
    const categoryCorrelations = detectCategoryIntersections(recentSignals);
    correlations.push(...categoryCorrelations.filter((c) => c.confidence >= 50));

    // 3. Multi-Agent Temporal Clustering
    const temporalClusters = detectTemporalClusters(recentSignals);
    correlations.push(...temporalClusters.filter((c) => c.confidence >= 50));

    // Store correlations
    let created = 0;
    for (const correlation of correlations) {
      // Check if this correlation already exists
      const existing = await findExistingCorrelation(
        ctx,
        args.stationId,
        correlation.signalIds
      );

      if (!existing) {
        await ctx.db.insert("signalCorrelations", {
          stationId: args.stationId,
          signalIds: correlation.signalIds,
          correlationType: correlation.type,
          confidence: correlation.confidence,
          description: correlation.reason,
          metadata: correlation.metadata,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return {
      correlationsFound: correlations.length,
      correlationsCreated: created,
      signalsAnalyzed: recentSignals.length,
    };
  },
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function groupSignalsByEntity(
  signals: SignalForCorrelation[]
): Record<string, SignalForCorrelation[]> {
  const groups: Record<string, SignalForCorrelation[]> = {};

  for (const signal of signals) {
    if (signal.entityType && signal.entityId) {
      const key = `${signal.entityType}:${signal.entityId}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(signal);
    }
  }

  return groups;
}

function calculateEntityCorrelation(
  signals: SignalForCorrelation[],
  entityKey: string
): CorrelationMatch {
  let confidence = CORRELATION_CONFIG.confidenceWeights.sameEntity;

  // Bonus for different source agents
  const uniqueAgents = new Set(signals.map((s) => s.sourceAgent));
  if (uniqueAgents.size > 1) {
    confidence += CORRELATION_CONFIG.confidenceWeights.differentAgents;
  }

  // Bonus for temporal proximity (closer = higher confidence)
  const timestamps = signals.map((s) => s.createdAt);
  const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
  const hourSpan = timeSpan / (60 * 60 * 1000);
  if (hourSpan < 1) {
    confidence += 15; // Within 1 hour
  } else if (hourSpan < 4) {
    confidence += 10; // Within 4 hours
  } else if (hourSpan < 12) {
    confidence += 5; // Within 12 hours
  }

  // Bonus for category intersection
  const categories = new Set(signals.map((s) => s.category));
  if (categories.size > 1) {
    const catArray = Array.from(categories);
    for (const intersection of CORRELATION_CONFIG.categoryIntersections) {
      if (intersection.every((cat) => catArray.includes(cat))) {
        confidence += CORRELATION_CONFIG.confidenceWeights.categoryMatch;
        break;
      }
    }
  }

  return {
    signalIds: signals.map((s) => s._id),
    type: "entity",
    confidence: Math.min(100, confidence),
    reason: `Multiple signals about ${entityKey} from ${uniqueAgents.size} agent(s)`,
    metadata: {
      entityKey,
      agentCount: uniqueAgents.size,
      categories: Array.from(categories),
    },
  };
}

function detectCategoryIntersections(
  signals: SignalForCorrelation[]
): CorrelationMatch[] {
  const correlations: CorrelationMatch[] = [];

  for (const intersection of CORRELATION_CONFIG.categoryIntersections) {
    const [cat1, cat2] = intersection;
    const cat1Signals = signals.filter((s) => s.category === cat1);
    const cat2Signals = signals.filter((s) => s.category === cat2);

    if (cat1Signals.length > 0 && cat2Signals.length > 0) {
      // Check for temporal proximity between categories
      for (const s1 of cat1Signals) {
        for (const s2 of cat2Signals) {
          const timeDiff = Math.abs(s1.createdAt - s2.createdAt);
          const hourDiff = timeDiff / (60 * 60 * 1000);

          if (hourDiff < 24) {
            let confidence = CORRELATION_CONFIG.confidenceWeights.temporal;
            confidence += CORRELATION_CONFIG.confidenceWeights.categoryMatch;

            // Bonus for same entity
            if (s1.entityId && s1.entityId === s2.entityId) {
              confidence += CORRELATION_CONFIG.confidenceWeights.sameEntity;
            }

            // Bonus for different agents
            if (s1.sourceAgent !== s2.sourceAgent) {
              confidence += CORRELATION_CONFIG.confidenceWeights.differentAgents;
            }

            if (confidence >= 50) {
              correlations.push({
                signalIds: [s1._id, s2._id],
                type: "category",
                confidence: Math.min(100, confidence),
                reason: `${cat1} and ${cat2} signals within ${hourDiff.toFixed(1)} hours`,
                metadata: {
                  categories: [cat1, cat2],
                  hourDiff,
                },
              });
            }
          }
        }
      }
    }
  }

  return correlations;
}

function detectTemporalClusters(
  signals: SignalForCorrelation[]
): CorrelationMatch[] {
  const correlations: CorrelationMatch[] = [];

  // Group signals into 1-hour buckets
  const hourBuckets: Record<number, SignalForCorrelation[]> = {};
  for (const signal of signals) {
    const hourKey = Math.floor(signal.createdAt / (60 * 60 * 1000));
    if (!hourBuckets[hourKey]) {
      hourBuckets[hourKey] = [];
    }
    hourBuckets[hourKey].push(signal);
  }

  // Find clusters with multiple signals from different agents
  for (const [, bucketSignals] of Object.entries(hourBuckets)) {
    const uniqueAgents = new Set(bucketSignals.map((s) => s.sourceAgent));

    if (
      bucketSignals.length >= 3 &&
      uniqueAgents.size >= 2
    ) {
      let confidence = CORRELATION_CONFIG.confidenceWeights.temporal;
      confidence += CORRELATION_CONFIG.confidenceWeights.differentAgents;
      confidence += Math.min(20, (bucketSignals.length - 2) * 5); // Bonus for more signals

      correlations.push({
        signalIds: bucketSignals.map((s) => s._id),
        type: "temporal",
        confidence: Math.min(100, confidence),
        reason: `Burst of ${bucketSignals.length} signals from ${uniqueAgents.size} agents within 1 hour`,
        metadata: {
          signalCount: bucketSignals.length,
          agentCount: uniqueAgents.size,
          agents: Array.from(uniqueAgents),
        },
      });
    }
  }

  return correlations;
}

async function findExistingCorrelation(
  ctx: { db: any },
  stationId: Id<"stations">,
  signalIds: Id<"signals">[]
): Promise<boolean> {
  // Simple check - look for correlations with the same signal IDs
  const sortedIds = [...signalIds].sort();

  const existing = await ctx.db
    .query("signalCorrelations")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .filter((q: any) => q.eq(q.field("status"), "active"))
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

export const list = query({
  args: {
    stationId: v.id("stations"),
    status: v.optional(v.union(v.literal("active"), v.literal("acknowledged"), v.literal("dismissed"))),
    minConfidence: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("signalCorrelations")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .collect();

    if (args.status) {
      results = results.filter((c) => c.status === args.status);
    }

    if (args.minConfidence !== undefined) {
      const minConf = args.minConfidence;
      results = results.filter((c) => c.confidence >= minConf);
    }

    return results.slice(0, args.limit || 50);
  },
});

export const getById = query({
  args: { correlationId: v.id("signalCorrelations") },
  handler: async (ctx, args) => {
    const correlation = await ctx.db.get(args.correlationId);
    if (!correlation) return null;

    // Fetch related signals
    const signals = await Promise.all(
      correlation.signalIds.map((id: Id<"signals">) => ctx.db.get(id))
    );

    return {
      ...correlation,
      signals: signals.filter(Boolean),
    };
  },
});

export const getRecent = query({
  args: {
    stationId: v.id("stations"),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const since = Date.now() - hours * 60 * 60 * 1000;

    const results = await ctx.db
      .query("signalCorrelations")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .order("desc")
      .collect();

    return results;
  },
});

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export const acknowledge = mutation({
  args: {
    correlationId: v.id("signalCorrelations"),
    acknowledgedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.correlationId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
      acknowledgedBy: args.acknowledgedBy,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const dismiss = mutation({
  args: {
    correlationId: v.id("signalCorrelations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.correlationId, {
      status: "dismissed",
      dismissedAt: Date.now(),
      dismissReason: args.reason,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// -----------------------------------------------------------------------------
// Trigger: Run correlation detection
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
      "correlations:detect" as any,
      { stationId: args.stationId }
    );
    return result;
  },
});
