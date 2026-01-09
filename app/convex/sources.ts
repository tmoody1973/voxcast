import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// Sources API - Knowledge Base Management
// =============================================================================

/**
 * List all sources for a station
 */
export const list = query({
  args: {
    stationId: v.id("stations"),
    type: v.optional(
      v.union(
        v.literal("document"),
        v.literal("spreadsheet"),
        v.literal("url"),
        v.literal("note"),
        v.literal("audio"),
        v.literal("video")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("sources")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId));

    const sources = await query.order("desc").collect();

    // Filter by type if specified
    const filtered = args.type
      ? sources.filter((s) => s.type === args.type)
      : sources;

    // Apply limit
    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

/**
 * Get a single source by ID
 */
export const get = query({
  args: {
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

/**
 * Create a new source
 */
export const create = mutation({
  args: {
    stationId: v.id("stations"),
    type: v.union(
      v.literal("document"),
      v.literal("spreadsheet"),
      v.literal("url"),
      v.literal("note"),
      v.literal("audio"),
      v.literal("video")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    url: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine initial processing status
    // Notes are immediately completed, files need processing
    const processingStatus =
      args.type === "note" || args.type === "url"
        ? "completed"
        : args.fileId
          ? "pending"
          : "completed";

    // Calculate word count for text content
    const wordCount = args.content
      ? args.content.split(/\s+/).filter(Boolean).length
      : undefined;

    const sourceId = await ctx.db.insert("sources", {
      stationId: args.stationId,
      type: args.type,
      name: args.name,
      description: args.description,
      content: args.content,
      url: args.url,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      processingStatus,
      wordCount,
      createdAt: now,
      updatedAt: now,
    });

    // TODO: If file was uploaded, trigger processing action
    // This would extract text from PDFs, spreadsheets, etc.

    return sourceId;
  },
});

/**
 * Generate upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Update a source
 */
export const update = mutation({
  args: {
    sourceId: v.id("sources"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    const updates: Partial<typeof source> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.content !== undefined) {
      updates.content = args.content;
      updates.wordCount = args.content.split(/\s+/).filter(Boolean).length;
    }

    await ctx.db.patch(args.sourceId, updates);
    return args.sourceId;
  },
});

/**
 * Delete a source
 */
export const remove = mutation({
  args: {
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    // Delete associated file if exists
    if (source.fileId) {
      await ctx.storage.delete(source.fileId);
    }

    await ctx.db.delete(args.sourceId);
    return { success: true };
  },
});

/**
 * Get source statistics for a station
 */
export const getStats = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const byType = sources.reduce(
      (acc, source) => {
        acc[source.type] = (acc[source.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalWords = sources.reduce(
      (sum, source) => sum + (source.wordCount || 0),
      0
    );

    return {
      total: sources.length,
      byType,
      totalWords,
      processing: sources.filter((s) => s.processingStatus === "processing")
        .length,
      failed: sources.filter((s) => s.processingStatus === "failed").length,
    };
  },
});

/**
 * Search sources by content (simple text search)
 */
export const search = query({
  args: {
    stationId: v.id("stations"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const searchLower = args.query.toLowerCase();

    const matches = sources.filter((source) => {
      const nameMatch = source.name.toLowerCase().includes(searchLower);
      const descMatch = source.description
        ?.toLowerCase()
        .includes(searchLower);
      const contentMatch = source.content?.toLowerCase().includes(searchLower);
      return nameMatch || descMatch || contentMatch;
    });

    // Sort by relevance (name matches first)
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase().includes(searchLower) ? 1 : 0;
      const bName = b.name.toLowerCase().includes(searchLower) ? 1 : 0;
      return bName - aName;
    });

    return args.limit ? matches.slice(0, args.limit) : matches;
  },
});
