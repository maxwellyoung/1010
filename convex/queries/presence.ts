import { query } from "../_generated/server";
import { v } from "convex/values";

// Get nearby presence signals (replaces get_nearby_presence RPC)
export const getNearbyPresence = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  returns: v.array(
    v.object({
      id: v.id("presenceSignals"),
      lat: v.number(),
      lng: v.number(),
      intensity: v.number(),
      ageMinutes: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all non-expired presence signals
    const signals = await ctx.db
      .query("presenceSignals")
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Filter by distance (bounding box + haversine)
    const latDelta = args.radiusKm / 111; // ~111km per degree latitude
    const lngDelta = args.radiusKm / (111 * Math.cos((args.lat * Math.PI) / 180));

    const nearby = signals.filter((signal) => {
      // Bounding box filter first (fast)
      if (
        signal.lat < args.lat - latDelta ||
        signal.lat > args.lat + latDelta ||
        signal.lng < args.lng - lngDelta ||
        signal.lng > args.lng + lngDelta
      ) {
        return false;
      }

      // Haversine distance (accurate)
      const distance = haversineDistance(
        args.lat,
        args.lng,
        signal.lat,
        signal.lng
      );
      return distance <= args.radiusKm;
    });

    // Calculate age in minutes and return
    return nearby.map((signal) => ({
      id: signal._id,
      lat: signal.lat,
      lng: signal.lng,
      intensity: signal.intensity,
      ageMinutes: Math.floor((signal.expiresAt - now) / 60000) + 15, // TTL is 15min, so age = 15 - remaining
    }));
  },
});

// Get online presence count
export const getPresenceCount = query({
  args: {},
  returns: v.object({
    total: v.number(),
    recent: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;

    const recentPresence = await ctx.db
      .query("presence")
      .filter((q) => q.gt(q.field("lastSeen"), fifteenMinutesAgo))
      .collect();

    return {
      total: recentPresence.length,
      recent: recentPresence.filter((p) => p.lastSeen > now - 5 * 60 * 1000).length,
    };
  },
});

// Get presence count by cell
export const getPresenceByCell = query({
  args: {
    cellId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const cellPresence = await ctx.db
      .query("presence")
      .withIndex("by_cell", (q) => q.eq("cellId", args.cellId))
      .filter((q) => q.gt(q.field("lastSeen"), fiveMinutesAgo))
      .collect();

    return cellPresence.length;
  },
});

// Haversine distance calculation
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
