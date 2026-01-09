import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// =============================================================================
// Scheduled Jobs
// =============================================================================

const crons = cronJobs();

// -----------------------------------------------------------------------------
// Daily Briefing Generation
// Runs every day at 12:00 UTC (7am EST, 4am PST)
// Each station's timezone preference should be handled by the generator
// -----------------------------------------------------------------------------

// Note: In production, this would iterate through all stations
// For MVP, we'll trigger briefing generation for stations that need it
crons.daily(
  "generate-daily-briefings",
  { hourUTC: 12, minuteUTC: 0 },
  internal.scheduled.generateAllBriefings
);

// -----------------------------------------------------------------------------
// Signal Correlation Detection
// Runs every hour to detect new correlations
// -----------------------------------------------------------------------------

crons.hourly(
  "detect-correlations",
  { minuteUTC: 15 },
  internal.scheduled.runCorrelationDetection
);

// -----------------------------------------------------------------------------
// Collision Detection
// Runs every 4 hours to detect cross-department conflicts
// -----------------------------------------------------------------------------

crons.interval(
  "detect-collisions",
  { hours: 4 },
  internal.scheduled.runCollisionDetection
);

// -----------------------------------------------------------------------------
// Signal Expiration Cleanup
// Runs daily to dismiss expired signals
// -----------------------------------------------------------------------------

crons.daily(
  "expire-old-signals",
  { hourUTC: 6, minuteUTC: 0 },
  internal.signals.expireOldSignals
);

export default crons;
