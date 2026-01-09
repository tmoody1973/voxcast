import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// MOO-17: Daily Briefing Generator
// Generates prioritized daily briefings for GMs
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface SignalForBriefing {
  _id: Id<"signals">;
  stationId: Id<"stations">;
  type: string;
  category: string;
  sourceAgent: string;
  severity: string;
  title: string;
  description: string;
  recommendedAction?: string;
  status: string;
  createdAt: number;
}

interface CorrelationForBriefing {
  _id: Id<"signalCorrelations">;
  stationId: Id<"stations">;
  signalIds: Id<"signals">[];
  correlationType: string;
  confidence: number;
  description: string;
  status: string;
  createdAt: number;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const BRIEFING_CONFIG = {
  // Lookback window for signals (24 hours)
  lookbackHours: 24,

  // Section thresholds
  urgentSeverities: ["high"],
  watchSeverities: ["medium"],
  fyiSeverities: ["low", "info"],

  // Minimum correlation confidence for inclusion
  minCorrelationConfidence: 50,

  // Max items per section
  maxUrgent: 10,
  maxWatch: 15,
  maxMomentum: 10,
  maxFyi: 20,
};

// Severity priority for sorting
const SEVERITY_PRIORITY: Record<string, number> = {
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

// -----------------------------------------------------------------------------
// Internal: Generate Daily Briefing
// -----------------------------------------------------------------------------

export const generate = internalMutation({
  args: {
    stationId: v.id("stations"),
    date: v.optional(v.string()), // ISO date, defaults to today
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = args.date || new Date().toISOString().split("T")[0];
    const lookbackMs = BRIEFING_CONFIG.lookbackHours * 60 * 60 * 1000;
    const windowStart = now - lookbackMs;

    // Check if briefing already exists for today
    const existingBriefing = await ctx.db
      .query("dailyBriefings")
      .withIndex("by_station_date", (q) =>
        q.eq("stationId", args.stationId).eq("date", today)
      )
      .first();

    if (existingBriefing) {
      return {
        success: false,
        message: "Briefing already exists for this date",
        briefingId: existingBriefing._id,
      };
    }

    // Get recent signals
    const recentSignals = await ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("createdAt"), windowStart))
      .collect();

    // Get recent correlations (including collisions)
    const recentCorrelations = await ctx.db
      .query("signalCorrelations")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), windowStart),
          q.eq(q.field("status"), "active"),
          q.gte(q.field("confidence"), BRIEFING_CONFIG.minCorrelationConfidence)
        )
      )
      .collect();

    // Categorize signals into sections
    const { urgent, watch, momentum, fyi } = categorizesignals(recentSignals);

    // Calculate stats
    const stats = {
      totalSignals: recentSignals.length,
      highSeverity: recentSignals.filter((s) => s.severity === "high").length,
      collisionsDetected: recentCorrelations.filter(
        (c) => c.correlationType === "collision"
      ).length,
    };

    // Create briefing
    const briefingId = await ctx.db.insert("dailyBriefings", {
      stationId: args.stationId,
      date: today,
      urgent: urgent.map((s) => s._id),
      watch: watch.map((s) => s._id),
      momentum: momentum.map((s) => s._id),
      fyi: fyi.map((s) => s._id),
      correlations: recentCorrelations.map((c) => c._id),
      stats,
      generatedAt: now,
    });

    return {
      success: true,
      briefingId,
      stats,
      sectionCounts: {
        urgent: urgent.length,
        watch: watch.length,
        momentum: momentum.length,
        fyi: fyi.length,
        correlations: recentCorrelations.length,
      },
    };
  },
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function categorizesignals(signals: SignalForBriefing[]) {
  // Sort all signals by severity then recency
  const sortedSignals = [...signals].sort((a, b) => {
    const severityDiff =
      (SEVERITY_PRIORITY[b.severity] || 0) - (SEVERITY_PRIORITY[a.severity] || 0);
    if (severityDiff !== 0) return severityDiff;
    return b.createdAt - a.createdAt;
  });

  // Categorize by severity
  const urgent = sortedSignals
    .filter((s) => BRIEFING_CONFIG.urgentSeverities.includes(s.severity))
    .slice(0, BRIEFING_CONFIG.maxUrgent);

  const watch = sortedSignals
    .filter((s) => BRIEFING_CONFIG.watchSeverities.includes(s.severity))
    .slice(0, BRIEFING_CONFIG.maxWatch);

  // Momentum: signals with specific types indicating trends
  const momentumTypes = [
    "donor.engagement_spike",
    "donor.upgrade_opportunity",
    "sponsor.upsell_opportunity",
    "membership.acquisition_spike",
    "event.registration_milestone",
    "marketing.campaign_performance",
  ];
  const momentum = sortedSignals
    .filter((s) => momentumTypes.includes(s.type))
    .slice(0, BRIEFING_CONFIG.maxMomentum);

  // FYI: everything else that's low/info severity
  const fyi = sortedSignals
    .filter(
      (s) =>
        BRIEFING_CONFIG.fyiSeverities.includes(s.severity) &&
        !momentumTypes.includes(s.type)
    )
    .slice(0, BRIEFING_CONFIG.maxFyi);

  return { urgent, watch, momentum, fyi };
}

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

export const getByDate = query({
  args: {
    stationId: v.id("stations"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const briefing = await ctx.db
      .query("dailyBriefings")
      .withIndex("by_station_date", (q) =>
        q.eq("stationId", args.stationId).eq("date", args.date)
      )
      .first();

    if (!briefing) return null;

    // Hydrate signals
    const [urgentSignals, watchSignals, momentumSignals, fyiSignals, correlations] =
      await Promise.all([
        Promise.all(briefing.urgent.map((id) => ctx.db.get(id))),
        Promise.all(briefing.watch.map((id) => ctx.db.get(id))),
        Promise.all(briefing.momentum.map((id) => ctx.db.get(id))),
        Promise.all(briefing.fyi.map((id) => ctx.db.get(id))),
        Promise.all(briefing.correlations.map((id) => ctx.db.get(id))),
      ]);

    return {
      ...briefing,
      urgentSignals: urgentSignals.filter(Boolean),
      watchSignals: watchSignals.filter(Boolean),
      momentumSignals: momentumSignals.filter(Boolean),
      fyiSignals: fyiSignals.filter(Boolean),
      correlationDetails: correlations.filter(Boolean),
    };
  },
});

export const getLatest = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const briefing = await ctx.db
      .query("dailyBriefings")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .first();

    if (!briefing) return null;

    // Hydrate signals
    const [urgentSignals, watchSignals, momentumSignals, fyiSignals, correlations] =
      await Promise.all([
        Promise.all(briefing.urgent.map((id) => ctx.db.get(id))),
        Promise.all(briefing.watch.map((id) => ctx.db.get(id))),
        Promise.all(briefing.momentum.map((id) => ctx.db.get(id))),
        Promise.all(briefing.fyi.map((id) => ctx.db.get(id))),
        Promise.all(briefing.correlations.map((id) => ctx.db.get(id))),
      ]);

    return {
      ...briefing,
      urgentSignals: urgentSignals.filter(Boolean),
      watchSignals: watchSignals.filter(Boolean),
      momentumSignals: momentumSignals.filter(Boolean),
      fyiSignals: fyiSignals.filter(Boolean),
      correlationDetails: correlations.filter(Boolean),
    };
  },
});

export const listRecent = query({
  args: {
    stationId: v.id("stations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const briefings = await ctx.db
      .query("dailyBriefings")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit || 7);

    return briefings;
  },
});

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export const markViewed = mutation({
  args: {
    briefingId: v.id("dailyBriefings"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const briefing = await ctx.db.get(args.briefingId);
    if (!briefing) {
      throw new Error("Briefing not found");
    }

    // Only mark as viewed if not already viewed
    if (!briefing.viewedAt) {
      await ctx.db.patch(args.briefingId, {
        viewedAt: Date.now(),
        viewedBy: args.userId,
      });
    }

    return { success: true };
  },
});

export const markDelivered = mutation({
  args: {
    briefingId: v.id("dailyBriefings"),
  },
  handler: async (ctx, args) => {
    const briefing = await ctx.db.get(args.briefingId);
    if (!briefing) {
      throw new Error("Briefing not found");
    }

    if (!briefing.deliveredAt) {
      await ctx.db.patch(args.briefingId, {
        deliveredAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// -----------------------------------------------------------------------------
// Manual Trigger for Testing
// -----------------------------------------------------------------------------

export const generateNow = mutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(
      // @ts-ignore - internal mutation
      "briefings:generate" as any,
      { stationId: args.stationId }
    );
    return result;
  },
});

// -----------------------------------------------------------------------------
// Regenerate Briefing (if needed)
// -----------------------------------------------------------------------------

export const regenerate = mutation({
  args: {
    stationId: v.id("stations"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Find and delete existing briefing
    const existing = await ctx.db
      .query("dailyBriefings")
      .withIndex("by_station_date", (q) =>
        q.eq("stationId", args.stationId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Generate new briefing
    const result = await ctx.runMutation(
      // @ts-ignore - internal mutation
      "briefings:generate" as any,
      { stationId: args.stationId, date: args.date }
    );

    return result;
  },
});
