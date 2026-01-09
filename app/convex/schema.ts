import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// VOXCAST SCHEMA - Station Console for Public Radio
// =============================================================================

// -----------------------------------------------------------------------------
// MOO-13: Signal Schema & Database Tables
// Station Pulse signal storage for cross-agent intelligence
// -----------------------------------------------------------------------------

const signalCategory = v.union(
  v.literal("donor"),
  v.literal("sponsor"),
  v.literal("programming"),
  v.literal("marketing"),
  v.literal("grant"),
  v.literal("event"),
  v.literal("membership")
);

const signalSeverity = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
  v.literal("info")
);

const signalStatus = v.union(
  v.literal("new"),
  v.literal("acknowledged"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("dismissed")
);

const sourceAgent = v.union(
  v.literal("sarah"),    // Development Director
  v.literal("marcus"),   // Marketing Director
  v.literal("diana"),    // Underwriting Director
  v.literal("jordan"),   // Program Director
  v.literal("pulse"),    // Station Pulse (system)
  v.literal("system")    // Automated/integration
);

// -----------------------------------------------------------------------------
// MOO-18: Knowledge Graph Schema
// Entity and relationship storage for institutional memory
// -----------------------------------------------------------------------------

const entityType = v.union(
  v.literal("person"),
  v.literal("organization"),
  v.literal("show"),
  v.literal("event"),
  v.literal("grant"),
  v.literal("campaign")
);

const relationshipType = v.union(
  v.literal("donates_to"),
  v.literal("sponsors"),
  v.literal("hosts"),
  v.literal("produces"),
  v.literal("attends"),
  v.literal("mentions"),
  v.literal("depends_on"),
  v.literal("works_at"),
  v.literal("related_to")
);

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

export default defineSchema({
  // ---------------------------------------------------------------------------
  // Core: Stations & Users
  // ---------------------------------------------------------------------------

  stations: defineTable({
    name: v.string(),
    callLetters: v.string(),
    market: v.string(),
    timezone: v.string(),
    settings: v.optional(v.object({
      briefingTime: v.optional(v.string()), // e.g., "07:00"
      notificationEmail: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_call_letters", ["callLetters"]),

  users: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_station", ["stationId"])
    .index("by_email", ["email"]),

  // ---------------------------------------------------------------------------
  // MOO-13: Signals - Cross-agent intelligence
  // ---------------------------------------------------------------------------

  signals: defineTable({
    stationId: v.id("stations"),
    type: v.string(),                    // e.g., "donor.lapse_risk", "sponsor.renewal_due"
    category: signalCategory,
    sourceAgent: sourceAgent,
    severity: signalSeverity,
    title: v.string(),
    description: v.string(),

    // Entity reference (optional - links to knowledge graph)
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),

    // Actionable intelligence
    recommendedAction: v.optional(v.string()),
    metadata: v.optional(v.any()),       // Flexible payload for signal-specific data

    // Lifecycle
    status: signalStatus,
    acknowledgedBy: v.optional(v.id("users")),
    acknowledgedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()),   // Auto-dismiss after this time
  })
    .index("by_station", ["stationId"])
    .index("by_station_status", ["stationId", "status"])
    .index("by_station_category", ["stationId", "category"])
    .index("by_station_severity", ["stationId", "severity"])
    .index("by_station_agent", ["stationId", "sourceAgent"])
    .index("by_station_type", ["stationId", "type"])
    .index("by_created", ["createdAt"])
    .index("by_entity", ["entityType", "entityId"]),

  // Signal correlations - links between related signals
  signalCorrelations: defineTable({
    stationId: v.id("stations"),
    signalIds: v.array(v.id("signals")),
    correlationType: v.union(
      v.literal("temporal"),      // Signals within time window
      v.literal("entity"),        // Same entity referenced
      v.literal("category"),      // Category intersection pattern
      v.literal("collision")      // Cross-department collision
    ),
    confidence: v.number(),       // 0-100 confidence score
    description: v.string(),
    metadata: v.optional(v.any()),

    // Lifecycle
    status: v.union(
      v.literal("active"),
      v.literal("acknowledged"),
      v.literal("dismissed")
    ),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
    dismissedAt: v.optional(v.number()),
    dismissReason: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_status", ["stationId", "status"])
    .index("by_created", ["createdAt"]),

  // ---------------------------------------------------------------------------
  // MOO-17: Daily Briefings
  // ---------------------------------------------------------------------------

  dailyBriefings: defineTable({
    stationId: v.id("stations"),
    date: v.string(),             // ISO date: "2026-01-09"

    // Briefing sections
    urgent: v.array(v.id("signals")),
    watch: v.array(v.id("signals")),
    momentum: v.array(v.id("signals")),
    fyi: v.array(v.id("signals")),

    // Correlations surfaced
    correlations: v.array(v.id("signalCorrelations")),

    // Summary stats
    stats: v.object({
      totalSignals: v.number(),
      highSeverity: v.number(),
      collisionsDetected: v.number(),
    }),

    // Delivery tracking
    generatedAt: v.number(),
    deliveredAt: v.optional(v.number()),
    viewedAt: v.optional(v.number()),
    viewedBy: v.optional(v.id("users")),
  })
    .index("by_station_date", ["stationId", "date"])
    .index("by_station", ["stationId"]),

  // ---------------------------------------------------------------------------
  // MOO-18: Knowledge Graph - Entities
  // ---------------------------------------------------------------------------

  entities: defineTable({
    stationId: v.id("stations"),
    type: entityType,
    name: v.string(),
    externalId: v.optional(v.string()),  // ID from source system (CRM, etc.)

    // Flexible attributes based on entity type
    attributes: v.optional(v.any()),

    // Engagement scoring
    engagementScore: v.optional(v.number()),
    lastInteraction: v.optional(v.number()),

    // Lifecycle
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_type", ["stationId", "type"])
    .index("by_external_id", ["externalId"])
    .index("by_name", ["name"]),

  // Knowledge Graph - Relationships between entities
  relationships: defineTable({
    stationId: v.id("stations"),
    fromEntityId: v.id("entities"),
    toEntityId: v.id("entities"),
    type: relationshipType,
    strength: v.number(),         // 0-100 relationship strength

    // Relationship metadata
    metadata: v.optional(v.any()),

    // Decay tracking
    lastReinforced: v.number(),   // Last time this relationship was active
    decayRate: v.optional(v.number()), // How fast strength decays

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_from_entity", ["fromEntityId"])
    .index("by_to_entity", ["toEntityId"])
    .index("by_type", ["type"]),

  // Knowledge Graph - Interactions (timestamped events)
  interactions: defineTable({
    stationId: v.id("stations"),
    entityId: v.id("entities"),
    type: v.string(),             // e.g., "donation", "email_open", "event_attendance"
    description: v.optional(v.string()),
    value: v.optional(v.number()), // Monetary value if applicable
    metadata: v.optional(v.any()),
    occurredAt: v.number(),
    recordedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_entity", ["entityId"])
    .index("by_type", ["type"])
    .index("by_occurred", ["occurredAt"]),

  // ---------------------------------------------------------------------------
  // MOO-25: Show Profiles
  // ---------------------------------------------------------------------------

  shows: defineTable({
    stationId: v.id("stations"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),

    // Schedule
    schedule: v.optional(v.object({
      dayOfWeek: v.array(v.number()),  // 0-6, Sunday = 0
      startTime: v.string(),            // "06:00"
      endTime: v.string(),              // "09:00"
    })),

    // Host reference
    hostEntityId: v.optional(v.id("entities")),

    // Outcome tags (MOO-29)
    outcomeTags: v.optional(v.array(v.union(
      v.literal("reach"),
      v.literal("conversion"),
      v.literal("brand"),
      v.literal("revenue")
    ))),

    // Aggregated metrics (updated periodically)
    metrics: v.optional(v.object({
      weeklyListeners: v.optional(v.number()),
      streamingHours: v.optional(v.number()),
      donorAffinity: v.optional(v.number()),    // Count of donors with affinity
      sponsorContracts: v.optional(v.number()), // Active sponsor count
      lastUpdated: v.number(),
    })),

    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_slug", ["stationId", "slug"])
    .index("by_active", ["stationId", "isActive"]),
});
