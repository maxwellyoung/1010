import { query } from "../_generated/server";
import { v } from "convex/values";

// Get network statistics (replaces network_stats view)
export const getNetworkStats = query({
  args: {},
  returns: v.object({
    totalParticipants: v.number(),
    activeLast24h: v.number(),
    activeLastHour: v.number(),
    pingDensity: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get all pings for counting
    const allPings = await ctx.db.query("pings").collect();

    // Count unique devices
    const uniqueDevices = new Set(allPings.map((p) => p.deviceId));

    // Filter for time windows
    const pingsLastDay = allPings.filter((p) => p._creationTime >= oneDayAgo);
    const pingsLastHour = allPings.filter((p) => p._creationTime >= oneHourAgo);

    const uniqueLastDay = new Set(pingsLastDay.map((p) => p.deviceId));
    const uniqueLastHour = new Set(pingsLastHour.map((p) => p.deviceId));

    // Calculate density (0-4 scale based on active users in last hour)
    const activeCount = uniqueLastHour.size;
    let pingDensity = 0;
    if (activeCount > 10) pingDensity = 4;
    else if (activeCount > 6) pingDensity = 3;
    else if (activeCount > 3) pingDensity = 2;
    else if (activeCount > 0) pingDensity = 1;

    return {
      totalParticipants: uniqueDevices.size,
      activeLast24h: uniqueLastDay.size,
      activeLastHour: uniqueLastHour.size,
      pingDensity,
    };
  },
});
