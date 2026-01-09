import { internalMutation } from "./_generated/server";

// =============================================================================
// Scheduled Job Handlers
// Called by cron jobs defined in crons.ts
// =============================================================================

// Return type for scheduled job results
interface ScheduledJobResult {
  stationsProcessed: number;
  results: Array<{
    stationId: string;
    callLetters: string;
    success?: boolean;
    error?: string;
    [key: string]: unknown;
  }>;
}

// -----------------------------------------------------------------------------
// Generate All Briefings
// Iterates through all active stations and generates daily briefings
// -----------------------------------------------------------------------------

export const generateAllBriefings = internalMutation({
  args: {},
  handler: async (ctx): Promise<ScheduledJobResult> => {
    // Get all stations
    const stations = await ctx.db.query("stations").collect();

    const results: ScheduledJobResult["results"] = [];
    for (const station of stations) {
      try {
        // Call the internal briefings.generate mutation directly
        const now = Date.now();
        const today = new Date().toISOString().split("T")[0];
        const lookbackMs = 24 * 60 * 60 * 1000;
        const windowStart = now - lookbackMs;

        // Check if briefing already exists
        const existingBriefing = await ctx.db
          .query("dailyBriefings")
          .withIndex("by_station_date", (q) =>
            q.eq("stationId", station._id).eq("date", today)
          )
          .first();

        if (existingBriefing) {
          results.push({
            stationId: station._id,
            callLetters: station.callLetters,
            success: false,
            message: "Briefing already exists",
          });
          continue;
        }

        // Get recent signals
        const recentSignals = await ctx.db
          .query("signals")
          .withIndex("by_station", (q) => q.eq("stationId", station._id))
          .filter((q) => q.gte(q.field("createdAt"), windowStart))
          .collect();

        // Get recent correlations
        const recentCorrelations = await ctx.db
          .query("signalCorrelations")
          .withIndex("by_station", (q) => q.eq("stationId", station._id))
          .filter((q) =>
            q.and(
              q.gte(q.field("createdAt"), windowStart),
              q.eq(q.field("status"), "active")
            )
          )
          .collect();

        // Categorize signals by severity
        const urgent = recentSignals
          .filter((s) => s.severity === "high")
          .map((s) => s._id);
        const watch = recentSignals
          .filter((s) => s.severity === "medium")
          .map((s) => s._id);
        const momentum = recentSignals
          .filter((s) =>
            [
              "donor.engagement_spike",
              "sponsor.upsell_opportunity",
              "membership.acquisition_spike",
            ].includes(s.type)
          )
          .map((s) => s._id);
        const fyi = recentSignals
          .filter((s) => ["low", "info"].includes(s.severity))
          .map((s) => s._id);

        // Create briefing
        const briefingId = await ctx.db.insert("dailyBriefings", {
          stationId: station._id,
          date: today,
          urgent,
          watch,
          momentum,
          fyi,
          correlations: recentCorrelations.map((c) => c._id),
          stats: {
            totalSignals: recentSignals.length,
            highSeverity: urgent.length,
            collisionsDetected: recentCorrelations.filter(
              (c) => c.correlationType === "collision"
            ).length,
          },
          generatedAt: now,
        });

        results.push({
          stationId: station._id,
          callLetters: station.callLetters,
          success: true,
          briefingId,
        });
      } catch (error) {
        results.push({
          stationId: station._id,
          callLetters: station.callLetters,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      stationsProcessed: stations.length,
      results,
    };
  },
});

// -----------------------------------------------------------------------------
// Run Correlation Detection
// Runs correlation detection for all active stations
// -----------------------------------------------------------------------------

export const runCorrelationDetection = internalMutation({
  args: {},
  handler: async (ctx): Promise<ScheduledJobResult> => {
    const stations = await ctx.db.query("stations").collect();

    const results: ScheduledJobResult["results"] = [];
    for (const station of stations) {
      try {
        const now = Date.now();
        const lookbackMs = 24 * 60 * 60 * 1000;
        const windowStart = now - lookbackMs;

        // Get recent signals
        const recentSignals = await ctx.db
          .query("signals")
          .withIndex("by_station", (q) => q.eq("stationId", station._id))
          .filter((q) => q.gte(q.field("createdAt"), windowStart))
          .collect();

        if (recentSignals.length < 2) {
          results.push({
            stationId: station._id,
            callLetters: station.callLetters,
            correlationsFound: 0,
            message: "Not enough signals",
          });
          continue;
        }

        // Simple entity-based correlation detection
        const entityGroups: Record<string, typeof recentSignals> = {};
        for (const signal of recentSignals) {
          if (signal.entityType && signal.entityId) {
            const key = `${signal.entityType}:${signal.entityId}`;
            if (!entityGroups[key]) entityGroups[key] = [];
            entityGroups[key].push(signal);
          }
        }

        let created = 0;
        for (const [entityKey, signals] of Object.entries(entityGroups)) {
          if (signals.length >= 2) {
            // Check for existing correlation
            const signalIds = signals.map((s) => s._id);
            const sortedIds = [...signalIds].sort();

            const existing = await ctx.db
              .query("signalCorrelations")
              .withIndex("by_station", (q) => q.eq("stationId", station._id))
              .filter((q) => q.eq(q.field("status"), "active"))
              .collect();

            const alreadyExists = existing.some((corr) => {
              const existingSorted = [...corr.signalIds].sort();
              return (
                existingSorted.length === sortedIds.length &&
                existingSorted.every((id, i) => id === sortedIds[i])
              );
            });

            if (!alreadyExists) {
              await ctx.db.insert("signalCorrelations", {
                stationId: station._id,
                signalIds,
                correlationType: "entity",
                confidence: 75,
                description: `Multiple signals about ${entityKey}`,
                metadata: { entityKey },
                status: "active",
                createdAt: now,
                updatedAt: now,
              });
              created++;
            }
          }
        }

        results.push({
          stationId: station._id,
          callLetters: station.callLetters,
          success: true,
          correlationsCreated: created,
          signalsAnalyzed: recentSignals.length,
        });
      } catch (error) {
        results.push({
          stationId: station._id,
          callLetters: station.callLetters,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      stationsProcessed: stations.length,
      results,
    };
  },
});

// -----------------------------------------------------------------------------
// Run Collision Detection
// Runs collision detection for all active stations
// -----------------------------------------------------------------------------

export const runCollisionDetection = internalMutation({
  args: {},
  handler: async (ctx): Promise<ScheduledJobResult> => {
    const stations = await ctx.db.query("stations").collect();

    const results: ScheduledJobResult["results"] = [];
    for (const station of stations) {
      try {
        const now = Date.now();
        const lookbackMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        const windowStart = now - lookbackMs;

        // Get recent signals
        const recentSignals = await ctx.db
          .query("signals")
          .withIndex("by_station", (q) => q.eq("stationId", station._id))
          .filter((q) => q.gte(q.field("createdAt"), windowStart))
          .collect();

        if (recentSignals.length < 2) {
          results.push({
            stationId: station._id,
            callLetters: station.callLetters,
            collisionsFound: 0,
            message: "Not enough signals",
          });
          continue;
        }

        // Simple collision detection: look for programming + donor signals
        const programmingSignals = recentSignals.filter(
          (s) => s.category === "programming"
        );
        const donorSignals = recentSignals.filter(
          (s) => s.category === "donor"
        );

        let created = 0;
        for (const progSignal of programmingSignals) {
          for (const donorSignal of donorSignals) {
            const timeDiff = Math.abs(progSignal.createdAt - donorSignal.createdAt);
            if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
              // Within 7 days
              const signalIds = [progSignal._id, donorSignal._id];
              const sortedIds = [...signalIds].sort();

              const existing = await ctx.db
                .query("signalCorrelations")
                .withIndex("by_station", (q) => q.eq("stationId", station._id))
                .filter((q) =>
                  q.and(
                    q.eq(q.field("correlationType"), "collision"),
                    q.eq(q.field("status"), "active")
                  )
                )
                .collect();

              const alreadyExists = existing.some((corr) => {
                const existingSorted = [...corr.signalIds].sort();
                return (
                  existingSorted.length === sortedIds.length &&
                  existingSorted.every((id, i) => id === sortedIds[i])
                );
              });

              if (!alreadyExists) {
                await ctx.db.insert("signalCorrelations", {
                  stationId: station._id,
                  signalIds,
                  correlationType: "collision",
                  confidence: 70,
                  description: `Programming ↔ Development collision: ${progSignal.title} + ${donorSignal.title}`,
                  metadata: {
                    collisionType: "programming_development",
                    affectedDepartments: ["programming", "development"],
                  },
                  status: "active",
                  createdAt: now,
                  updatedAt: now,
                });
                created++;
              }
            }
          }
        }

        results.push({
          stationId: station._id,
          callLetters: station.callLetters,
          success: true,
          collisionsCreated: created,
          signalsAnalyzed: recentSignals.length,
        });
      } catch (error) {
        results.push({
          stationId: station._id,
          callLetters: station.callLetters,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      stationsProcessed: stations.length,
      results,
    };
  },
});
