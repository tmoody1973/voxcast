import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Social Media Connections - OAuth & Data Integration
// Supports: Facebook, Instagram, LinkedIn, Twitter/X, YouTube, Google Analytics
// =============================================================================

// Platform-specific configuration
const PLATFORM_CONFIG = {
  facebook: {
    name: "Facebook",
    icon: "📘",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    apiBase: "https://graph.facebook.com/v18.0",
    scopes: ["pages_read_engagement", "pages_read_user_content", "pages_show_list"],
  },
  instagram: {
    name: "Instagram",
    icon: "📸",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth", // Uses Facebook OAuth
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    apiBase: "https://graph.facebook.com/v18.0",
    scopes: ["instagram_basic", "instagram_manage_insights", "pages_show_list"],
  },
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    apiBase: "https://api.linkedin.com/v2",
    scopes: ["r_organization_social", "rw_organization_admin"],
  },
  twitter: {
    name: "X (Twitter)",
    icon: "🐦",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    apiBase: "https://api.twitter.com/2",
    scopes: ["tweet.read", "users.read", "offline.access"],
  },
  youtube: {
    name: "YouTube",
    icon: "📺",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    apiBase: "https://www.googleapis.com/youtube/v3",
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
  },
  google_analytics: {
    name: "Google Analytics",
    icon: "📊",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    apiBase: "https://analyticsdata.googleapis.com/v1beta",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  },
};

type Platform = keyof typeof PLATFORM_CONFIG;

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

/**
 * List all social connections for a station
 */
export const list = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("socialConnections")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    return connections.map((conn) => ({
      ...conn,
      platformConfig: PLATFORM_CONFIG[conn.platform as Platform],
      // Don't expose tokens to frontend
      accessToken: undefined,
      refreshToken: undefined,
    }));
  },
});

/**
 * Get a single connection by ID
 */
export const get = query({
  args: {
    connectionId: v.id("socialConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return null;

    return {
      ...connection,
      platformConfig: PLATFORM_CONFIG[connection.platform as Platform],
      accessToken: undefined,
      refreshToken: undefined,
    };
  },
});

/**
 * Get available platforms for connection
 */
export const getAvailablePlatforms = query({
  args: {},
  handler: async () => {
    return Object.entries(PLATFORM_CONFIG).map(([key, config]) => ({
      id: key,
      ...config,
    }));
  },
});

/**
 * Get connection status summary for a station
 */
export const getStatusSummary = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("socialConnections")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    return {
      total: connections.length,
      active: connections.filter((c) => c.status === "active").length,
      expired: connections.filter((c) => c.status === "expired").length,
      error: connections.filter((c) => c.status === "error").length,
      platforms: connections.map((c) => ({
        platform: c.platform,
        status: c.status,
        accountName: c.accountName,
        lastSyncAt: c.lastSyncAt,
      })),
    };
  },
});

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

/**
 * Generate OAuth URL for a platform
 */
export const generateAuthUrl = action({
  args: {
    stationId: v.id("stations"),
    platform: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const config = PLATFORM_CONFIG[args.platform as Platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${args.platform}`);
    }

    // Get client ID from environment
    const clientIdKey = `${args.platform.toUpperCase()}_CLIENT_ID`;
    const clientId = process.env[clientIdKey];

    if (!clientId) {
      throw new Error(
        `${config.name} integration is not configured. ` +
        `Add ${clientIdKey} and ${args.platform.toUpperCase()}_CLIENT_SECRET to your Convex environment variables.`
      );
    }

    // Generate state token (includes station ID for callback)
    const state = Buffer.from(
      JSON.stringify({
        stationId: args.stationId,
        platform: args.platform,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: args.redirectUri,
      scope: config.scopes.join(" "),
      response_type: "code",
      state,
    });

    return `${config.authUrl}?${params.toString()}`;
  },
});

/**
 * Exchange OAuth code for tokens and save connection
 */
export const completeOAuth = action({
  args: {
    code: v.string(),
    state: v.string(),
    redirectUri: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; connectionId: Id<"socialConnections">; accountName: string }> => {
    // Decode state
    const stateData = JSON.parse(Buffer.from(args.state, "base64").toString());
    const { stationId, platform } = stateData;

    const config = PLATFORM_CONFIG[platform as Platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Get credentials
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials for ${platform}`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: args.code,
        redirect_uri: args.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`OAuth token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get account info
    const accountInfo = await getAccountInfo(
      platform,
      tokens.access_token,
      config.apiBase
    );

    // Save connection
    const connectionId = await ctx.runMutation(internal.socialConnections.saveConnection, {
      stationId,
      platform,
      accountId: accountInfo.id,
      accountName: accountInfo.name,
      accountType: accountInfo.type,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? Date.now() + tokens.expires_in * 1000
        : undefined,
      permissions: config.scopes,
      connectedBy: args.userId,
    });

    return { success: true, connectionId, accountName: accountInfo.name };
  },
});

/**
 * Internal: Save connection to database
 */
export const saveConnection = internalMutation({
  args: {
    stationId: v.id("stations"),
    platform: v.string(),
    accountId: v.string(),
    accountName: v.string(),
    accountType: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    permissions: v.array(v.string()),
    connectedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if connection already exists
    const existing = await ctx.db
      .query("socialConnections")
      .withIndex("by_station_platform", (q) =>
        q.eq("stationId", args.stationId).eq("platform", args.platform as any)
      )
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        accountId: args.accountId,
        accountName: args.accountName,
        accountType: args.accountType,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        permissions: args.permissions,
        status: "active",
        lastError: undefined,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("socialConnections", {
      stationId: args.stationId,
      platform: args.platform as any,
      accountId: args.accountId,
      accountName: args.accountName,
      accountType: args.accountType,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      syncEnabled: true,
      syncFrequency: "daily",
      status: "active",
      permissions: args.permissions,
      connectedBy: args.connectedBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Disconnect a social account
 */
export const disconnect = mutation({
  args: {
    connectionId: v.id("socialConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      syncEnabled: false,
      accessToken: "",
      refreshToken: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update sync settings
 */
export const updateSyncSettings = mutation({
  args: {
    connectionId: v.id("socialConnections"),
    syncEnabled: v.optional(v.boolean()),
    syncFrequency: v.optional(
      v.union(v.literal("hourly"), v.literal("daily"), v.literal("weekly"))
    ),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.syncEnabled !== undefined) {
      updates.syncEnabled = args.syncEnabled;
    }
    if (args.syncFrequency !== undefined) {
      updates.syncFrequency = args.syncFrequency;
    }

    await ctx.db.patch(args.connectionId, updates);
    return { success: true };
  },
});

// -----------------------------------------------------------------------------
// Data Fetching Actions
// -----------------------------------------------------------------------------

/**
 * Sync data from a connected platform
 */
export const syncPlatformData = action({
  args: {
    connectionId: v.id("socialConnections"),
  },
  handler: async (ctx, args) => {
    // Get connection with token
    const connection = await ctx.runQuery(internal.socialConnections.getWithToken, {
      connectionId: args.connectionId,
    });

    if (!connection || connection.status !== "active") {
      throw new Error("Connection not active");
    }

    const config = PLATFORM_CONFIG[connection.platform as Platform];
    let data;

    try {
      switch (connection.platform) {
        case "facebook":
          data = await fetchFacebookData(connection.accessToken, connection.accountId, config.apiBase);
          break;
        case "instagram":
          data = await fetchInstagramData(connection.accessToken, connection.accountId, config.apiBase);
          break;
        case "linkedin":
          data = await fetchLinkedInData(connection.accessToken, connection.accountId, config.apiBase);
          break;
        case "twitter":
          data = await fetchTwitterData(connection.accessToken, connection.accountId, config.apiBase);
          break;
        case "google_analytics":
          data = await fetchGoogleAnalyticsData(connection.accessToken, connection.accountId, config.apiBase);
          break;
        default:
          throw new Error(`Sync not implemented for ${connection.platform}`);
      }

      // Save metrics to database
      await ctx.runMutation(internal.socialConnections.saveMetrics, {
        stationId: connection.stationId,
        connectionId: args.connectionId,
        platform: connection.platform,
        data,
      });

      // Update last sync time
      await ctx.runMutation(internal.socialConnections.updateSyncStatus, {
        connectionId: args.connectionId,
        status: "active",
        lastSyncAt: Date.now(),
      });

      return { success: true, recordsImported: Object.keys(data).length };
    } catch (error) {
      // Update connection with error
      await ctx.runMutation(internal.socialConnections.updateSyncStatus, {
        connectionId: args.connectionId,
        status: "error",
        lastError: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

/**
 * Internal: Get connection with token (not exposed to frontend)
 */
export const getWithToken = internalQuery({
  args: {
    connectionId: v.id("socialConnections"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Internal: Save synced metrics
 */
export const saveMetrics = internalMutation({
  args: {
    stationId: v.id("stations"),
    connectionId: v.id("socialConnections"),
    platform: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayStart = new Date().setHours(0, 0, 0, 0);
    const dayEnd = new Date().setHours(23, 59, 59, 999);

    // Store page insights
    if (args.data.pageInsights) {
      await ctx.db.insert("socialMetrics", {
        stationId: args.stationId,
        connectionId: args.connectionId,
        platform: args.platform,
        metricType: "page_insights",
        periodStart: dayStart,
        periodEnd: dayEnd,
        data: args.data.pageInsights,
        fetchedAt: now,
      });
    }

    // Store recent posts
    if (args.data.posts) {
      for (const post of args.data.posts.slice(0, 20)) {
        await ctx.db.insert("socialMetrics", {
          stationId: args.stationId,
          connectionId: args.connectionId,
          platform: args.platform,
          metricType: "post",
          periodStart: post.createdTime || dayStart,
          periodEnd: post.createdTime || dayEnd,
          data: post,
          fetchedAt: now,
        });
      }
    }

    // Store engagement summary
    if (args.data.engagement) {
      await ctx.db.insert("socialMetrics", {
        stationId: args.stationId,
        connectionId: args.connectionId,
        platform: args.platform,
        metricType: "engagement",
        periodStart: dayStart,
        periodEnd: dayEnd,
        data: args.data.engagement,
        fetchedAt: now,
      });
    }
  },
});

/**
 * Internal: Update sync status
 */
export const updateSyncStatus = internalMutation({
  args: {
    connectionId: v.id("socialConnections"),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("error"),
      v.literal("disconnected")
    ),
    lastSyncAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.lastSyncAt) updates.lastSyncAt = args.lastSyncAt;
    if (args.lastError) updates.lastError = args.lastError;

    await ctx.db.patch(args.connectionId, updates);
  },
});

// -----------------------------------------------------------------------------
// Helper Functions - Platform-specific API calls
// -----------------------------------------------------------------------------

async function getAccountInfo(
  platform: string,
  accessToken: string,
  apiBase: string
): Promise<{ id: string; name: string; type?: string }> {
  switch (platform) {
    case "facebook":
    case "instagram": {
      const response = await fetch(
        `${apiBase}/me?fields=id,name&access_token=${accessToken}`
      );
      const data = await response.json();
      return { id: data.id, name: data.name, type: "page" };
    }
    case "linkedin": {
      const response = await fetch(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      return {
        id: data.id,
        name: `${data.localizedFirstName} ${data.localizedLastName}`,
        type: "profile",
      };
    }
    case "twitter": {
      const response = await fetch(`${apiBase}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      return { id: data.data.id, name: data.data.name, type: "profile" };
    }
    case "google_analytics": {
      // Return placeholder - GA4 uses property IDs
      return { id: "ga4", name: "Google Analytics 4", type: "property" };
    }
    default:
      throw new Error(`Account info not implemented for ${platform}`);
  }
}

async function fetchFacebookData(
  accessToken: string,
  pageId: string,
  apiBase: string
) {
  // Get page insights
  const insightsResponse = await fetch(
    `${apiBase}/${pageId}/insights?` +
      `metric=page_impressions,page_engaged_users,page_fans,page_views_total` +
      `&period=day&access_token=${accessToken}`
  );
  const pageInsights = await insightsResponse.json();

  // Get recent posts
  const postsResponse = await fetch(
    `${apiBase}/${pageId}/posts?` +
      `fields=id,message,created_time,shares,reactions.summary(true),comments.summary(true)` +
      `&limit=20&access_token=${accessToken}`
  );
  const posts = await postsResponse.json();

  return {
    pageInsights: pageInsights.data,
    posts: posts.data?.map((post: any) => ({
      id: post.id,
      message: post.message,
      createdTime: new Date(post.created_time).getTime(),
      shares: post.shares?.count || 0,
      reactions: post.reactions?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
    })),
    engagement: {
      totalReactions: posts.data?.reduce(
        (sum: number, p: any) => sum + (p.reactions?.summary?.total_count || 0),
        0
      ),
      totalComments: posts.data?.reduce(
        (sum: number, p: any) => sum + (p.comments?.summary?.total_count || 0),
        0
      ),
      totalShares: posts.data?.reduce(
        (sum: number, p: any) => sum + (p.shares?.count || 0),
        0
      ),
    },
  };
}

async function fetchInstagramData(
  accessToken: string,
  userId: string,
  apiBase: string
) {
  // Get Instagram business account
  const accountResponse = await fetch(
    `${apiBase}/${userId}?fields=instagram_business_account&access_token=${accessToken}`
  );
  const accountData = await accountResponse.json();
  const igAccountId = accountData.instagram_business_account?.id;

  if (!igAccountId) {
    throw new Error("No Instagram Business account linked");
  }

  // Get account insights
  const insightsResponse = await fetch(
    `${apiBase}/${igAccountId}/insights?` +
      `metric=impressions,reach,profile_views,follower_count` +
      `&period=day&access_token=${accessToken}`
  );
  const pageInsights = await insightsResponse.json();

  // Get recent media
  const mediaResponse = await fetch(
    `${apiBase}/${igAccountId}/media?` +
      `fields=id,caption,media_type,timestamp,like_count,comments_count` +
      `&limit=20&access_token=${accessToken}`
  );
  const media = await mediaResponse.json();

  return {
    pageInsights: pageInsights.data,
    posts: media.data?.map((item: any) => ({
      id: item.id,
      message: item.caption,
      mediaType: item.media_type,
      createdTime: new Date(item.timestamp).getTime(),
      likes: item.like_count || 0,
      comments: item.comments_count || 0,
    })),
    engagement: {
      totalLikes: media.data?.reduce(
        (sum: number, p: any) => sum + (p.like_count || 0),
        0
      ),
      totalComments: media.data?.reduce(
        (sum: number, p: any) => sum + (p.comments_count || 0),
        0
      ),
    },
  };
}

async function fetchLinkedInData(
  accessToken: string,
  userId: string,
  apiBase: string
) {
  // Get organization pages (requires r_organization_social scope)
  const orgsResponse = await fetch(
    `${apiBase}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName)))`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const orgsData = await orgsResponse.json();

  // Get shares/posts for first organization
  const orgId = orgsData.elements?.[0]?.organization;
  if (!orgId) {
    return { pageInsights: null, posts: [], engagement: {} };
  }

  const sharesResponse = await fetch(
    `${apiBase}/shares?q=owners&owners=${orgId}&count=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const shares = await sharesResponse.json();

  return {
    pageInsights: null, // LinkedIn doesn't have simple page insights API
    posts: shares.elements?.map((share: any) => ({
      id: share.id,
      message: share.text?.text,
      createdTime: share.created?.time,
    })),
    engagement: {},
  };
}

async function fetchTwitterData(
  accessToken: string,
  userId: string,
  apiBase: string
) {
  // Get user info
  const userResponse = await fetch(
    `${apiBase}/users/me?user.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const userData = await userResponse.json();

  // Get recent tweets
  const tweetsResponse = await fetch(
    `${apiBase}/users/${userData.data.id}/tweets?` +
      `tweet.fields=created_at,public_metrics&max_results=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const tweets = await tweetsResponse.json();

  return {
    pageInsights: {
      followers: userData.data.public_metrics?.followers_count,
      following: userData.data.public_metrics?.following_count,
      tweetCount: userData.data.public_metrics?.tweet_count,
    },
    posts: tweets.data?.map((tweet: any) => ({
      id: tweet.id,
      message: tweet.text,
      createdTime: new Date(tweet.created_at).getTime(),
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      replies: tweet.public_metrics?.reply_count || 0,
    })),
    engagement: {
      totalLikes: tweets.data?.reduce(
        (sum: number, t: any) => sum + (t.public_metrics?.like_count || 0),
        0
      ),
      totalRetweets: tweets.data?.reduce(
        (sum: number, t: any) => sum + (t.public_metrics?.retweet_count || 0),
        0
      ),
    },
  };
}

async function fetchGoogleAnalyticsData(
  accessToken: string,
  propertyId: string,
  apiBase: string
) {
  // GA4 Data API request
  const response = await fetch(`${apiBase}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
      dimensions: [{ name: "date" }],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google Analytics data");
  }

  const data = await response.json();

  return {
    pageInsights: {
      activeUsers: data.rows?.[0]?.metricValues?.[0]?.value,
      sessions: data.rows?.[0]?.metricValues?.[1]?.value,
      pageViews: data.rows?.[0]?.metricValues?.[2]?.value,
      avgSessionDuration: data.rows?.[0]?.metricValues?.[3]?.value,
    },
    posts: [], // GA doesn't have posts
    engagement: {},
    rawData: data,
  };
}

// -----------------------------------------------------------------------------
// Queries for Agent Tools
// -----------------------------------------------------------------------------

/**
 * Get social metrics for agent analysis
 */
export const getMetricsForAgent = query({
  args: {
    stationId: v.id("stations"),
    platform: v.optional(v.string()),
    metricType: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack || 7;
    const startDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    let query = ctx.db
      .query("socialMetrics")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId));

    const metrics = await query
      .filter((q) => q.gte(q.field("fetchedAt"), startDate))
      .collect();

    // Filter by platform and type if specified
    let filtered = metrics;
    if (args.platform) {
      filtered = filtered.filter((m) => m.platform === args.platform);
    }
    if (args.metricType) {
      filtered = filtered.filter((m) => m.metricType === args.metricType);
    }

    return filtered;
  },
});

/**
 * Get engagement summary for all connected platforms
 */
export const getEngagementSummary = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("socialConnections")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const summaries = await Promise.all(
      connections.map(async (conn) => {
        const metrics = await ctx.db
          .query("socialMetrics")
          .withIndex("by_connection", (q) => q.eq("connectionId", conn._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("metricType"), "engagement"),
              q.gte(q.field("fetchedAt"), oneWeekAgo)
            )
          )
          .first();

        return {
          platform: conn.platform,
          accountName: conn.accountName,
          ...metrics?.data,
        };
      })
    );

    return summaries;
  },
});
