import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// MOO-14: Signal Emission API
// Allows agents to emit signals to Station Pulse
// =============================================================================

// -----------------------------------------------------------------------------
// Signal Types by Category
// -----------------------------------------------------------------------------

const SIGNAL_TYPES = {
  donor: [
    "donor.lapse_risk",
    "donor.upgrade_opportunity",
    "donor.engagement_spike",
    "donor.engagement_drop",
    "donor.milestone",
    "donor.complaint",
    "donor.show_affinity",
  ],
  sponsor: [
    "sponsor.renewal_due",
    "sponsor.engagement_drop",
    "sponsor.upsell_opportunity",
    "sponsor.contract_expiring",
    "sponsor.complaint",
    "sponsor.payment_issue",
  ],
  programming: [
    "programming.schedule_change",
    "programming.show_performance",
    "programming.host_issue",
    "programming.audience_shift",
    "programming.content_gap",
  ],
  marketing: [
    "marketing.campaign_performance",
    "marketing.audience_insight",
    "marketing.channel_issue",
    "marketing.brand_mention",
  ],
  grant: [
    "grant.deadline_approaching",
    "grant.narrative_mismatch",
    "grant.compliance_risk",
    "grant.opportunity",
  ],
  event: [
    "event.registration_milestone",
    "event.attendance_concern",
    "event.vip_registered",
    "event.capacity_alert",
  ],
  membership: [
    "membership.renewal_wave",
    "membership.churn_risk",
    "membership.acquisition_spike",
  ],
} as const;

// -----------------------------------------------------------------------------
// Emit Signal
// -----------------------------------------------------------------------------

export const emit = mutation({
  args: {
    stationId: v.id("stations"),
    type: v.string(),
    category: v.union(
      v.literal("donor"),
      v.literal("sponsor"),
      v.literal("programming"),
      v.literal("marketing"),
      v.literal("grant"),
      v.literal("event"),
      v.literal("membership")
    ),
    sourceAgent: v.union(
      v.literal("sarah"),
      v.literal("marcus"),
      v.literal("diana"),
      v.literal("jordan"),
      v.literal("pulse"),
      v.literal("system")
    ),
    severity: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
      v.literal("info")
    ),
    title: v.string(),
    description: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    recommendedAction: v.optional(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate signal type exists for category
    const validTypes = SIGNAL_TYPES[args.category] || [];
    if (!validTypes.includes(args.type as any)) {
      console.warn(`Unknown signal type: ${args.type} for category: ${args.category}`);
    }

    const signalId = await ctx.db.insert("signals", {
      stationId: args.stationId,
      type: args.type,
      category: args.category,
      sourceAgent: args.sourceAgent,
      severity: args.severity,
      title: args.title,
      description: args.description,
      entityType: args.entityType,
      entityId: args.entityId,
      recommendedAction: args.recommendedAction,
      metadata: args.metadata,
      status: "new",
      createdAt: now,
      updatedAt: now,
      expiresAt: args.expiresAt,
    });

    return { signalId, createdAt: now };
  },
});

// -----------------------------------------------------------------------------
// Batch Emit (for bulk signal creation)
// -----------------------------------------------------------------------------

export const emitBatch = mutation({
  args: {
    signals: v.array(v.object({
      stationId: v.id("stations"),
      type: v.string(),
      category: v.union(
        v.literal("donor"),
        v.literal("sponsor"),
        v.literal("programming"),
        v.literal("marketing"),
        v.literal("grant"),
        v.literal("event"),
        v.literal("membership")
      ),
      sourceAgent: v.union(
        v.literal("sarah"),
        v.literal("marcus"),
        v.literal("diana"),
        v.literal("jordan"),
        v.literal("pulse"),
        v.literal("system")
      ),
      severity: v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low"),
        v.literal("info")
      ),
      title: v.string(),
      description: v.string(),
      entityType: v.optional(v.string()),
      entityId: v.optional(v.string()),
      recommendedAction: v.optional(v.string()),
      metadata: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const signalIds: Id<"signals">[] = [];

    for (const signal of args.signals) {
      const signalId = await ctx.db.insert("signals", {
        ...signal,
        status: "new",
        createdAt: now,
        updatedAt: now,
      });
      signalIds.push(signalId);
    }

    return { signalIds, count: signalIds.length };
  },
});

// -----------------------------------------------------------------------------
// Query Signals
// -----------------------------------------------------------------------------

export const list = query({
  args: {
    stationId: v.id("stations"),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("acknowledged"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("dismissed")
    )),
    category: v.optional(v.union(
      v.literal("donor"),
      v.literal("sponsor"),
      v.literal("programming"),
      v.literal("marketing"),
      v.literal("grant"),
      v.literal("event"),
      v.literal("membership")
    )),
    severity: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
      v.literal("info")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId));

    const signals = await query.order("desc").collect();

    // Apply filters in memory (Convex doesn't support multi-field index filtering)
    let filtered = signals;

    if (args.status) {
      filtered = filtered.filter((s) => s.status === args.status);
    }
    if (args.category) {
      filtered = filtered.filter((s) => s.category === args.category);
    }
    if (args.severity) {
      filtered = filtered.filter((s) => s.severity === args.severity);
    }

    const limit = args.limit || 50;
    return filtered.slice(0, limit);
  },
});

export const getById = query({
  args: { signalId: v.id("signals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.signalId);
  },
});

export const getRecent = query({
  args: {
    stationId: v.id("stations"),
    hours: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursAgo = (args.hours || 24) * 60 * 60 * 1000;
    const cutoff = Date.now() - hoursAgo;

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .order("desc")
      .take(args.limit || 100);

    return signals;
  },
});

// -----------------------------------------------------------------------------
// Update Signal Status
// -----------------------------------------------------------------------------

export const acknowledge = mutation({
  args: {
    signalId: v.id("signals"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.signalId, {
      status: "acknowledged",
      acknowledgedBy: args.userId,
      acknowledgedAt: now,
      updatedAt: now,
    });
    return { success: true };
  },
});

export const resolve = mutation({
  args: {
    signalId: v.id("signals"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.signalId, {
      status: "resolved",
      resolvedBy: args.userId,
      resolvedAt: now,
      updatedAt: now,
    });
    return { success: true };
  },
});

export const dismiss = mutation({
  args: {
    signalId: v.id("signals"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.signalId, {
      status: "dismissed",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// -----------------------------------------------------------------------------
// Internal: Expire old signals
// -----------------------------------------------------------------------------

export const expireOldSignals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find signals past their expiration
    const expiredSignals = await ctx.db
      .query("signals")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "resolved"),
          q.neq(q.field("status"), "dismissed"),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    for (const signal of expiredSignals) {
      await ctx.db.patch(signal._id, {
        status: "dismissed",
        updatedAt: now,
      });
    }

    return { expired: expiredSignals.length };
  },
});
