import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Clean up expired presence signals
export const cleanupExpiredPresenceSignals = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("presenceSignals")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const signal of expired) {
      await ctx.db.delete(signal._id);
    }

    if (expired.length > 0) {
      console.log(`[CLEANUP] Deleted ${expired.length} expired presence signals`);
    }
    return null;
  },
});

// Clean up expired broadcasts
export const cleanupExpiredBroadcasts = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("broadcasts")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const broadcast of expired) {
      await ctx.db.delete(broadcast._id);
    }

    if (expired.length > 0) {
      console.log(`[CLEANUP] Deleted ${expired.length} expired broadcasts`);
    }
    return null;
  },
});

// Clean up stale presence heartbeats (older than 30 minutes)
export const cleanupStalePresence = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    const stale = await ctx.db
      .query("presence")
      .withIndex("by_last_seen")
      .filter((q) => q.lt(q.field("lastSeen"), thirtyMinutesAgo))
      .collect();

    for (const presence of stale) {
      await ctx.db.delete(presence._id);
    }

    if (stale.length > 0) {
      console.log(`[CLEANUP] Deleted ${stale.length} stale presence records`);
    }
    return null;
  },
});

// Clean up old trails (older than 7 days)
export const cleanupOldTrails = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const oldTrails = await ctx.db
      .query("trails")
      .filter((q) => q.lt(q.field("_creationTime"), sevenDaysAgo))
      .collect();

    for (const trail of oldTrails) {
      await ctx.db.delete(trail._id);
    }

    if (oldTrails.length > 0) {
      console.log(`[CLEANUP] Deleted ${oldTrails.length} old trail points`);
    }
    return null;
  },
});
