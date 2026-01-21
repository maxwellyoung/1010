import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired presence signals every 5 minutes
crons.interval(
  "cleanup expired presence signals",
  { minutes: 5 },
  internal.cleanup.cleanupExpiredPresenceSignals
);

// Clean up expired broadcasts every 5 minutes
crons.interval(
  "cleanup expired broadcasts",
  { minutes: 5 },
  internal.cleanup.cleanupExpiredBroadcasts
);

// Clean up stale presence heartbeats every 5 minutes
crons.interval(
  "cleanup stale presence",
  { minutes: 5 },
  internal.cleanup.cleanupStalePresence
);

// Clean up old trails (older than 7 days) once per day
crons.interval(
  "cleanup old trails",
  { hours: 24 },
  internal.cleanup.cleanupOldTrails
);

export default crons;
