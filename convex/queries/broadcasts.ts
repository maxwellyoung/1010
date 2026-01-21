import { query } from "../_generated/server";
import { v } from "convex/values";

// Get recent ghost pings (for real-time subscription)
export const getRecentGhostPings = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();

    const ghosts = await ctx.db
      .query("broadcasts")
      .withIndex("by_type", (q) => q.eq("type", "ghost"))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .take(8);

    return ghosts.map((g) => ({
      id: g._id,
      ...g.payload,
      receivedAt: g._creationTime,
    }));
  },
});

// Get current window moment broadcast
export const getCurrentWindowMoment = query({
  args: {},
  returns: v.object({
    isOpen: v.boolean(),
    startedAt: v.union(v.number(), v.null()),
    endsAt: v.union(v.number(), v.null()),
    position: v.union(
      v.object({
        x: v.number(),
        y: v.number(),
      }),
      v.null()
    ),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    const window = await ctx.db
      .query("broadcasts")
      .withIndex("by_type", (q) => q.eq("type", "window"))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .first();

    if (!window) {
      return {
        isOpen: false,
        startedAt: null,
        endsAt: null,
        position: null,
      };
    }

    const payload = window.payload as {
      isOpen: boolean;
      startedAt: number | null;
      endsAt: number | null;
      position: { x: number; y: number } | null;
    };

    return payload;
  },
});

// Get density events for a cell
export const getDensityForCell = query({
  args: {
    cellId: v.string(),
  },
  returns: v.object({
    count: v.number(),
    densityScore: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    const events = await ctx.db
      .query("broadcasts")
      .withIndex("by_type", (q) => q.eq("type", "density"))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Filter by cellId in payload
    const cellEvents = events.filter((e) => {
      const payload = e.payload as { cellId?: string };
      return payload.cellId === args.cellId;
    });

    // Count events to compute density score
    const count = cellEvents.length;
    let densityScore = 0;
    if (count > 10) densityScore = 4;
    else if (count > 6) densityScore = 3;
    else if (count > 3) densityScore = 2;
    else if (count > 1) densityScore = 1;

    return { count, densityScore };
  },
});

// Get all recent broadcasts (for combined subscription)
export const getRecentBroadcasts = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("broadcasts"),
      type: v.union(v.literal("ghost"), v.literal("window"), v.literal("density")),
      deviceId: v.string(),
      payload: v.any(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();

    const broadcasts = await ctx.db
      .query("broadcasts")
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .take(50);

    return broadcasts.map((b) => ({
      id: b._id,
      type: b.type,
      deviceId: b.deviceId,
      payload: b.payload,
      createdAt: b._creationTime,
    }));
  },
});
