import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// Internal Queries for Agent Tools
// =============================================================================

export const getStationInfo = internalQuery({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    const station = await ctx.db.get(args.stationId);
    return station;
  },
});

export const getSources = internalQuery({
  args: {
    stationId: v.id("stations"),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit || 50);

    // Filter by type if provided
    const filtered = args.type
      ? sources.filter((s) => s.type === args.type)
      : sources;

    return filtered.map((s) => ({
      id: s._id,
      name: s.name,
      type: s.type,
      description: s.description,
      contentPreview: s.content?.slice(0, 500),
      wordCount: s.wordCount,
      createdAt: s.createdAt,
    }));
  },
});

export const getSourceContent = internalQuery({
  args: {
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) return null;
    return {
      id: source._id,
      name: source.name,
      type: source.type,
      description: source.description,
      content: source.content,
      url: source.url,
      wordCount: source.wordCount,
    };
  },
});

export const searchSources = internalQuery({
  args: {
    stationId: v.id("stations"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const queryLower = args.query.toLowerCase();
    const matches = sources.filter((s) => {
      return (
        s.name.toLowerCase().includes(queryLower) ||
        s.description?.toLowerCase().includes(queryLower) ||
        s.content?.toLowerCase().includes(queryLower)
      );
    });

    return matches.map((s) => ({
      id: s._id,
      name: s.name,
      type: s.type,
      description: s.description,
      matchedContent: s.content?.toLowerCase().includes(queryLower)
        ? extractSnippet(s.content!, queryLower)
        : null,
    }));
  },
});

function extractSnippet(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const index = lowerContent.indexOf(query);
  if (index === -1) return content.slice(0, 200);

  const start = Math.max(0, index - 100);
  const end = Math.min(content.length, index + query.length + 100);
  return (start > 0 ? "..." : "") + content.slice(start, end) + (end < content.length ? "..." : "");
}

export const getRecentSignals = internalQuery({
  args: {
    stationId: v.id("stations"),
    limit: v.optional(v.number()),
    severity: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("signals")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit || 20);

    return signals.filter((s) => {
      if (args.severity && s.severity !== args.severity) return false;
      if (args.category && s.category !== args.category) return false;
      return true;
    });
  },
});

export const getLatestBriefing = internalQuery({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyBriefings")
      .withIndex("by_station_date", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .first();
  },
});

export const getCorrelations = internalQuery({
  args: {
    stationId: v.id("stations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("signalCorrelations")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit || 10);
  },
});

export const searchEntities = internalQuery({
  args: {
    stationId: v.id("stations"),
    query: v.string(),
    entityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .take(100);

    const queryLower = args.query.toLowerCase();
    return entities.filter((e) => {
      if (args.entityType && e.type !== args.entityType) return false;
      return (
        e.name.toLowerCase().includes(queryLower) ||
        e.type.toLowerCase().includes(queryLower)
      );
    });
  },
});

export const getSocialMetrics = internalQuery({
  args: {
    stationId: v.id("stations"),
    platform: v.optional(v.string()),
    metricType: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get connected accounts first
    const connections = await ctx.db
      .query("socialConnections")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (connections.length === 0) {
      return { connected: false, platforms: [], metrics: [] };
    }

    // Get metrics for the specified timeframe
    const cutoffTime = Date.now() - (args.daysBack || 30) * 24 * 60 * 60 * 1000;

    let metricsQuery = ctx.db
      .query("socialMetrics")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("periodStart"), cutoffTime));

    const metrics = await metricsQuery.collect();

    // Filter by platform and metric type if specified
    const filteredMetrics = metrics.filter((m) => {
      if (args.platform && m.platform !== args.platform) return false;
      if (args.metricType && m.metricType !== args.metricType) return false;
      return true;
    });

    return {
      connected: true,
      platforms: connections.map((c) => ({
        platform: c.platform,
        accountName: c.accountName,
        lastSync: c.lastSyncAt,
        status: c.status,
      })),
      metrics: filteredMetrics.map((m) => ({
        platform: m.platform,
        metricType: m.metricType,
        periodStart: m.periodStart,
        periodEnd: m.periodEnd,
        data: m.data,
        fetchedAt: m.fetchedAt,
      })),
    };
  },
});

export const getSocialSummary = internalQuery({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    // Get all active connections
    const connections = await ctx.db
      .query("socialConnections")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (connections.length === 0) {
      return {
        connected: false,
        summary: "No social media accounts connected. Connect accounts to get social analytics.",
      };
    }

    // Get recent metrics (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const metrics = await ctx.db
      .query("socialMetrics")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.gte(q.field("periodStart"), weekAgo))
      .collect();

    // Build summary by platform
    const platformSummaries: Record<string, {
      accountName: string;
      lastSync: number | undefined;
      engagement: Record<string, number>;
      posts: number;
    }> = {};

    for (const conn of connections) {
      const platformMetrics = metrics.filter((m) => m.connectionId === conn._id);

      let totalEngagement: Record<string, number> = {};
      let totalPosts = 0;

      for (const m of platformMetrics) {
        if (m.data?.engagement) {
          for (const [key, value] of Object.entries(m.data.engagement)) {
            totalEngagement[key] = (totalEngagement[key] || 0) + (typeof value === "number" ? value : 0);
          }
        }
        if (m.data?.posts?.length) {
          totalPosts += m.data.posts.length;
        }
      }

      platformSummaries[conn.platform] = {
        accountName: conn.accountName,
        lastSync: conn.lastSyncAt,
        engagement: totalEngagement,
        posts: totalPosts,
      };
    }

    return {
      connected: true,
      platforms: Object.keys(platformSummaries),
      summaries: platformSummaries,
      totalConnections: connections.length,
      lastUpdated: Math.max(...connections.map((c) => c.lastSyncAt || 0)),
    };
  },
});

// =============================================================================
// Tool Definitions for Claude
// =============================================================================

const tools: Anthropic.Tool[] = [
  {
    name: "get_station_info",
    description: "Get information about the current station including name, call letters, and market",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_sources",
    description: "List all sources (documents, spreadsheets, notes, URLs) in the station's knowledge base. Filter by type if needed.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["document", "spreadsheet", "url", "note"],
          description: "Filter by source type",
        },
        limit: {
          type: "number",
          description: "Maximum number of sources to return",
        },
      },
      required: [],
    },
  },
  {
    name: "search_sources",
    description: "Search through all sources for specific content. Returns matching sources with relevant snippets.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query to find in source names, descriptions, or content",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_source_content",
    description: "Get the full content of a specific source by its ID",
    input_schema: {
      type: "object" as const,
      properties: {
        source_id: {
          type: "string",
          description: "The source ID to retrieve",
        },
      },
      required: ["source_id"],
    },
  },
  {
    name: "get_signals",
    description: "Get recent intel/signals. Filter by severity (high, medium, low, info) or category (donor, sponsor, programming, etc.)",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number" },
        severity: { type: "string", enum: ["high", "medium", "low", "info"] },
        category: { type: "string", enum: ["donor", "sponsor", "programming", "marketing", "grant", "event", "membership"] },
      },
      required: [],
    },
  },
  {
    name: "get_briefing",
    description: "Get the latest daily briefing summary with prioritized items",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_correlations",
    description: "Get detected patterns and correlations across signals",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number" },
      },
      required: [],
    },
  },
  {
    name: "search_entities",
    description: "Search for people, organizations, shows, or other entities",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        entityType: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_social_metrics",
    description: "Get social media metrics and analytics from connected accounts (Facebook, Instagram, LinkedIn, Twitter, YouTube, Google Analytics). Filter by platform or metric type.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: ["facebook", "instagram", "linkedin", "twitter", "youtube", "google_analytics"],
          description: "Filter by specific platform",
        },
        metricType: {
          type: "string",
          enum: ["post", "page_insights", "audience", "engagement"],
          description: "Filter by metric type",
        },
        daysBack: {
          type: "number",
          description: "Number of days to look back (default 30)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_social_summary",
    description: "Get a summary of all connected social media accounts with engagement highlights from the past week",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// =============================================================================
// System Prompt - Consultant + Data Assistant
// =============================================================================

const getSystemPrompt = (stationName: string, market: string) => `You are Station Agent, an experienced radio industry consultant and AI assistant for ${stationName} in ${market}.

## Your Role
You serve as both a **strategic advisor** and **knowledge base assistant**:

1. **Advisory Mode**: Help station leadership think through problems, brainstorm ideas, develop strategies, and navigate challenges. Draw on your knowledge of the radio/media industry, fundraising best practices, audience development, and station management.

2. **Data Mode**: When asked about specific station data, use your tools to search sources, retrieve intel, and ground your responses in the station's actual information.

## Capabilities
- Search and analyze uploaded documents, spreadsheets, and notes
- Retrieve and summarize intel/signals
- Find patterns and correlations in station data
- Search for entities (donors, sponsors, shows, people)
- Access social media analytics (Facebook, Instagram, LinkedIn, Twitter, YouTube, Google Analytics)
- Analyze audience engagement and content performance across platforms
- Provide industry expertise and strategic guidance

## Response Style
- Be direct and actionable - station leaders are busy
- Lead with insights, not data dumps
- Use bullet points for clarity
- When citing data, mention the source: "According to your Q4 report..."
- For advisory questions without data, share expertise directly
- Ask clarifying questions when helpful

## Industry Context
You understand:
- Public radio fundraising (pledge drives, major gifts, planned giving)
- Underwriting/sponsorship sales
- Programming strategy (local vs. national content)
- Audience development and Nielsen/PPM ratings
- Digital strategy (streaming, podcasts, apps)
- Station management and team dynamics
- NPR/network relationships

## When No Data Exists
If sources are empty, you can still:
1. Answer general industry questions
2. Help brainstorm strategies
3. Guide them on what data to upload
4. Discuss best practices

Don't say "I can't help without data" - be useful either way.

## Conversation Style
Be a trusted advisor, not a robotic data retrieval system. Station GMs and PDs want a thinking partner who understands their world.`;

// =============================================================================
// Main Chat Action
// =============================================================================

export const chat = action({
  args: {
    stationId: v.id("stations"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<string> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return "I'm not configured yet. Please add your ANTHROPIC_API_KEY to the environment variables.";
    }

    const anthropic = new Anthropic({ apiKey });

    // Get station info for system prompt
    const station = await ctx.runQuery(internal.agent.getStationInfo, {
      stationId: args.stationId,
    });

    const systemPrompt = getSystemPrompt(
      station?.name || "Your Station",
      station?.market || "your market"
    );

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = args.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Initial API call
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    });

    // Handle tool use loop (max 5 iterations)
    let iterations = 0;
    while (response.stop_reason === "tool_use" && iterations < 5) {
      iterations++;

      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      if (!toolUseBlock) break;

      let toolResult: unknown;

      // Execute the requested tool
      switch (toolUseBlock.name) {
        case "get_station_info":
          toolResult = await ctx.runQuery(internal.agent.getStationInfo, {
            stationId: args.stationId,
          });
          break;

        case "list_sources":
          const listInput = toolUseBlock.input as { type?: string; limit?: number };
          toolResult = await ctx.runQuery(internal.agent.getSources, {
            stationId: args.stationId,
            type: listInput.type,
            limit: listInput.limit,
          });
          break;

        case "search_sources":
          const searchSourcesInput = toolUseBlock.input as { query: string };
          toolResult = await ctx.runQuery(internal.agent.searchSources, {
            stationId: args.stationId,
            query: searchSourcesInput.query,
          });
          break;

        case "get_source_content":
          const getContentInput = toolUseBlock.input as { source_id: string };
          toolResult = await ctx.runQuery(internal.agent.getSourceContent, {
            sourceId: getContentInput.source_id as any,
          });
          break;

        case "get_signals":
          const signalInput = toolUseBlock.input as {
            limit?: number;
            severity?: string;
            category?: string;
          };
          toolResult = await ctx.runQuery(internal.agent.getRecentSignals, {
            stationId: args.stationId,
            limit: signalInput.limit,
            severity: signalInput.severity,
            category: signalInput.category,
          });
          break;

        case "get_briefing":
          toolResult = await ctx.runQuery(internal.agent.getLatestBriefing, {
            stationId: args.stationId,
          });
          break;

        case "get_correlations":
          const corrInput = toolUseBlock.input as { limit?: number };
          toolResult = await ctx.runQuery(internal.agent.getCorrelations, {
            stationId: args.stationId,
            limit: corrInput.limit,
          });
          break;

        case "search_entities":
          const entityInput = toolUseBlock.input as {
            query: string;
            entityType?: string;
          };
          toolResult = await ctx.runQuery(internal.agent.searchEntities, {
            stationId: args.stationId,
            query: entityInput.query,
            entityType: entityInput.entityType,
          });
          break;

        case "get_social_metrics":
          const socialInput = toolUseBlock.input as {
            platform?: string;
            metricType?: string;
            daysBack?: number;
          };
          toolResult = await ctx.runQuery(internal.agent.getSocialMetrics, {
            stationId: args.stationId,
            platform: socialInput.platform,
            metricType: socialInput.metricType,
            daysBack: socialInput.daysBack,
          });
          break;

        case "get_social_summary":
          toolResult = await ctx.runQuery(internal.agent.getSocialSummary, {
            stationId: args.stationId,
          });
          break;

        default:
          toolResult = { error: "Unknown tool" };
      }

      // Continue conversation with tool result
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages: [
          ...anthropicMessages,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(toolResult),
              },
            ],
          },
        ],
      });
    }

    // Extract text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );

    return textBlock?.text || "I couldn't generate a response. Please try again.";
  },
});
