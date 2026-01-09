import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// MOO-18: Knowledge Graph - Entity Management
// Institutional memory storage for Station Pulse
// =============================================================================

// -----------------------------------------------------------------------------
// Create Entity
// -----------------------------------------------------------------------------

export const create = mutation({
  args: {
    stationId: v.id("stations"),
    type: v.union(
      v.literal("person"),
      v.literal("organization"),
      v.literal("show"),
      v.literal("event"),
      v.literal("grant"),
      v.literal("campaign")
    ),
    name: v.string(),
    externalId: v.optional(v.string()),
    attributes: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing entity with same external ID
    if (args.externalId) {
      const existing = await ctx.db
        .query("entities")
        .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
        .first();

      if (existing) {
        // Update existing entity instead of creating duplicate
        await ctx.db.patch(existing._id, {
          name: args.name,
          attributes: args.attributes,
          updatedAt: now,
        });
        return { entityId: existing._id, updated: true };
      }
    }

    const entityId = await ctx.db.insert("entities", {
      stationId: args.stationId,
      type: args.type,
      name: args.name,
      externalId: args.externalId,
      attributes: args.attributes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { entityId, updated: false };
  },
});

// -----------------------------------------------------------------------------
// Update Entity
// -----------------------------------------------------------------------------

export const update = mutation({
  args: {
    entityId: v.id("entities"),
    name: v.optional(v.string()),
    attributes: v.optional(v.any()),
    engagementScore: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { entityId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(entityId, {
      ...filtered,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// -----------------------------------------------------------------------------
// Query Entities
// -----------------------------------------------------------------------------

export const getById = query({
  args: { entityId: v.id("entities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.entityId);
  },
});

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

export const list = query({
  args: {
    stationId: v.id("stations"),
    type: v.optional(v.union(
      v.literal("person"),
      v.literal("organization"),
      v.literal("show"),
      v.literal("event"),
      v.literal("grant"),
      v.literal("campaign")
    )),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("entities")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    if (args.type) {
      results = results.filter((e) => e.type === args.type);
    }

    if (args.activeOnly) {
      results = results.filter((e) => e.isActive);
    }

    return results.slice(0, args.limit || 100);
  },
});

export const search = query({
  args: {
    stationId: v.id("stations"),
    query: v.string(),
    type: v.optional(v.union(
      v.literal("person"),
      v.literal("organization"),
      v.literal("show"),
      v.literal("event"),
      v.literal("grant"),
      v.literal("campaign")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.query.toLowerCase();

    let results = await ctx.db
      .query("entities")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by name match
    results = results.filter((e) =>
      e.name.toLowerCase().includes(searchLower)
    );

    if (args.type) {
      results = results.filter((e) => e.type === args.type);
    }

    return results.slice(0, args.limit || 20);
  },
});

// =============================================================================
// Relationship Management
// =============================================================================

export const createRelationship = mutation({
  args: {
    stationId: v.id("stations"),
    fromEntityId: v.id("entities"),
    toEntityId: v.id("entities"),
    type: v.union(
      v.literal("donates_to"),
      v.literal("sponsors"),
      v.literal("hosts"),
      v.literal("produces"),
      v.literal("attends"),
      v.literal("mentions"),
      v.literal("depends_on"),
      v.literal("works_at"),
      v.literal("related_to")
    ),
    strength: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if relationship already exists
    const existing = await ctx.db
      .query("relationships")
      .withIndex("by_from_entity", (q) => q.eq("fromEntityId", args.fromEntityId))
      .filter((q) =>
        q.and(
          q.eq(q.field("toEntityId"), args.toEntityId),
          q.eq(q.field("type"), args.type)
        )
      )
      .first();

    if (existing) {
      // Reinforce existing relationship
      const newStrength = Math.min(100, (existing.strength || 50) + 10);
      await ctx.db.patch(existing._id, {
        strength: newStrength,
        lastReinforced: now,
        updatedAt: now,
      });
      return { relationshipId: existing._id, reinforced: true };
    }

    const relationshipId = await ctx.db.insert("relationships", {
      stationId: args.stationId,
      fromEntityId: args.fromEntityId,
      toEntityId: args.toEntityId,
      type: args.type,
      strength: args.strength ?? 50,
      metadata: args.metadata,
      lastReinforced: now,
      createdAt: now,
      updatedAt: now,
    });

    return { relationshipId, reinforced: false };
  },
});

export const getRelationships = query({
  args: {
    entityId: v.id("entities"),
    direction: v.optional(v.union(v.literal("from"), v.literal("to"), v.literal("both"))),
    type: v.optional(v.union(
      v.literal("donates_to"),
      v.literal("sponsors"),
      v.literal("hosts"),
      v.literal("produces"),
      v.literal("attends"),
      v.literal("mentions"),
      v.literal("depends_on"),
      v.literal("works_at"),
      v.literal("related_to")
    )),
  },
  handler: async (ctx, args) => {
    const direction = args.direction || "both";
    const results: any[] = [];

    if (direction === "from" || direction === "both") {
      let fromRels = await ctx.db
        .query("relationships")
        .withIndex("by_from_entity", (q) => q.eq("fromEntityId", args.entityId))
        .collect();

      if (args.type) {
        fromRels = fromRels.filter((r) => r.type === args.type);
      }

      for (const rel of fromRels) {
        const toEntity = await ctx.db.get(rel.toEntityId);
        results.push({ ...rel, direction: "outgoing", relatedEntity: toEntity });
      }
    }

    if (direction === "to" || direction === "both") {
      let toRels = await ctx.db
        .query("relationships")
        .withIndex("by_to_entity", (q) => q.eq("toEntityId", args.entityId))
        .collect();

      if (args.type) {
        toRels = toRels.filter((r) => r.type === args.type);
      }

      for (const rel of toRels) {
        const fromEntity = await ctx.db.get(rel.fromEntityId);
        results.push({ ...rel, direction: "incoming", relatedEntity: fromEntity });
      }
    }

    return results;
  },
});

// =============================================================================
// Interaction Recording
// =============================================================================

export const recordInteraction = mutation({
  args: {
    stationId: v.id("stations"),
    entityId: v.id("entities"),
    type: v.string(),
    description: v.optional(v.string()),
    value: v.optional(v.number()),
    metadata: v.optional(v.any()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const interactionId = await ctx.db.insert("interactions", {
      stationId: args.stationId,
      entityId: args.entityId,
      type: args.type,
      description: args.description,
      value: args.value,
      metadata: args.metadata,
      occurredAt: args.occurredAt ?? now,
      recordedAt: now,
    });

    // Update entity's last interaction time
    await ctx.db.patch(args.entityId, {
      lastInteraction: args.occurredAt ?? now,
      updatedAt: now,
    });

    return { interactionId };
  },
});

export const getInteractions = query({
  args: {
    entityId: v.id("entities"),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("interactions")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .order("desc")
      .collect();

    if (args.type) {
      results = results.filter((i) => i.type === args.type);
    }

    return results.slice(0, args.limit || 50);
  },
});
