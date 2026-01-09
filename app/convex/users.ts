import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// =============================================================================
// User Management
// =============================================================================

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    // Also get the station
    const station = await ctx.db.get(user.stationId);

    return {
      ...user,
      station,
    };
  },
});

// Get current user's station
export const getCurrentStation = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    return ctx.db.get(user.stationId);
  },
});

// List users by station
export const listByStation = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();
  },
});

// Create or update user (for Clerk webhook or initial setup)
export const upsert = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("gm"),
      v.literal("development"),
      v.literal("marketing"),
      v.literal("underwriting"),
      v.literal("programming"),
      v.literal("admin")
    ),
    stationId: v.id("stations"),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        role: args.role,
        stationId: args.stationId,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("users", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create a demo station and user for testing
export const createDemoSetup = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      const station = await ctx.db.get(existingUser.stationId);
      return { userId: existingUser._id, stationId: existingUser.stationId, station };
    }

    // Check for existing demo station
    let station = await ctx.db
      .query("stations")
      .withIndex("by_call_letters", (q) => q.eq("callLetters", "DEMO"))
      .first();

    // Create demo station if needed
    if (!station) {
      const stationId = await ctx.db.insert("stations", {
        name: "Demo Public Radio",
        callLetters: "DEMO",
        market: "Demo Market",
        timezone: "America/New_York",
        settings: {
          briefingTime: "07:00",
        },
        createdAt: now,
        updatedAt: now,
      });
      station = await ctx.db.get(stationId);
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: "gm",
      stationId: station!._id,
      createdAt: now,
      updatedAt: now,
    });

    return { userId, stationId: station!._id, station };
  },
});
