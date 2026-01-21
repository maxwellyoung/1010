import { query } from "../_generated/server";
import { v } from "convex/values";

const trailPointValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  ts: v.number(),
  seq: v.number(),
});

const trailSessionValidator = v.object({
  sessionId: v.string(),
  points: v.array(trailPointValidator),
});

// Get trails for a device in a time range
export const getTrailsInRange = query({
  args: {
    deviceId: v.string(),
    since: v.number(),
    excludeSessionId: v.optional(v.string()),
  },
  returns: v.array(trailSessionValidator),
  handler: async (ctx, args) => {
    const trails = await ctx.db
      .query("trails")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    // Filter out current session if specified
    const filtered = args.excludeSessionId
      ? trails.filter((t) => t.sessionId !== args.excludeSessionId)
      : trails;

    // Group by session
    const sessions = new Map<
      string,
      Array<{ lat: number; lng: number; ts: number; seq: number }>
    >();

    for (const trail of filtered) {
      const points = sessions.get(trail.sessionId) || [];
      points.push({
        lat: trail.lat,
        lng: trail.lng,
        ts: trail._creationTime,
        seq: trail.seq,
      });
      sessions.set(trail.sessionId, points);
    }

    // Sort points within each session by sequence
    for (const [, points] of sessions) {
      points.sort((a, b) => a.seq - b.seq);
    }

    return Array.from(sessions.entries()).map(([sessionId, points]) => ({
      sessionId,
      points,
    }));
  },
});

// Get window moments in a time range
export const getWindowMomentsInRange = query({
  args: {
    since: v.number(),
  },
  returns: v.array(
    v.object({
      id: v.id("windowMoments"),
      startedAt: v.number(),
      endsAt: v.number(),
      positionX: v.number(),
      positionY: v.number(),
      participantCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const moments = await ctx.db
      .query("windowMoments")
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    return moments.map((m) => ({
      id: m._id,
      startedAt: m.startedAt,
      endsAt: m.endsAt,
      positionX: m.positionX,
      positionY: m.positionY,
      participantCount: m.participantCount,
    }));
  },
});

// Get pings count in a time range (for presence count in temporal view)
export const getPingsInRange = query({
  args: {
    since: v.number(),
  },
  returns: v.object({
    uniqueCount: v.number(),
    totalPings: v.number(),
  }),
  handler: async (ctx, args) => {
    const pings = await ctx.db
      .query("pings")
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    const uniqueDevices = new Set(pings.map((p) => p.deviceId));
    return {
      uniqueCount: uniqueDevices.size,
      totalPings: pings.length,
    };
  },
});

// Combined temporal snapshot query
export const getTemporalSnapshot = query({
  args: {
    deviceId: v.string(),
    since: v.number(),
    currentSessionId: v.optional(v.string()),
  },
  returns: v.object({
    trails: v.array(trailSessionValidator),
    encounters: v.array(
      v.object({
        id: v.id("encounters"),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        createdAt: v.number(),
        maxResonance: v.number(),
      })
    ),
    windowMoments: v.array(
      v.object({
        id: v.id("windowMoments"),
        startedAt: v.number(),
      })
    ),
    presenceCount: v.number(),
    encounterCount: v.number(),
    windowCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get trails
    const trailsData = await ctx.db
      .query("trails")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    const filteredTrails = args.currentSessionId
      ? trailsData.filter((t) => t.sessionId !== args.currentSessionId)
      : trailsData;

    // Group trails by session
    const sessions = new Map<
      string,
      Array<{ lat: number; lng: number; ts: number; seq: number }>
    >();
    for (const trail of filteredTrails) {
      const points = sessions.get(trail.sessionId) || [];
      points.push({
        lat: trail.lat,
        lng: trail.lng,
        ts: trail._creationTime,
        seq: trail.seq,
      });
      sessions.set(trail.sessionId, points);
    }

    // Get encounters
    const encounters = await ctx.db
      .query("encounters")
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    // Get window moments
    const windowMoments = await ctx.db
      .query("windowMoments")
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    // Get unique presence count
    const pings = await ctx.db
      .query("pings")
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    const uniqueDevices = new Set(pings.map((p) => p.deviceId));

    return {
      trails: Array.from(sessions.entries()).map(([sessionId, points]) => ({
        sessionId,
        points: points.sort((a, b) => a.seq - b.seq),
      })),
      encounters: encounters.map((e) => ({
        id: e._id,
        lat: e.lat,
        lng: e.lng,
        createdAt: e._creationTime,
        maxResonance: e.maxResonance,
      })),
      windowMoments: windowMoments.map((m) => ({
        id: m._id,
        startedAt: m.startedAt,
      })),
      presenceCount: uniqueDevices.size,
      encounterCount: encounters.length,
      windowCount: windowMoments.length,
    };
  },
});
