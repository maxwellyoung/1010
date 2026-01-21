import { mutation } from "../_generated/server";
import { v } from "convex/values";

const PRESENCE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Insert a ping (heartbeat for stats)
export const insertPing = mutation({
  args: {
    deviceId: v.string(),
    postcode: v.string(),
    lat: v.number(),
    lng: v.number(),
    source: v.string(),
  },
  returns: v.id("pings"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("pings", args);
  },
});

// Insert or update presence signal (for heat map)
export const upsertPresenceSignal = mutation({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    intensity: v.number(),
  },
  returns: v.id("presenceSignals"),
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + PRESENCE_TTL_MS;

    // Check for existing signal from this device
    const existing = await ctx.db
      .query("presenceSignals")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (existing) {
      // Update existing signal
      await ctx.db.patch(existing._id, {
        lat: args.lat,
        lng: args.lng,
        intensity: args.intensity,
        expiresAt,
      });
      return existing._id;
    }

    // Insert new signal
    return await ctx.db.insert("presenceSignals", {
      ...args,
      expiresAt,
    });
  },
});

// Combined ping + presence signal (single network call)
export const sendPing = mutation({
  args: {
    deviceId: v.string(),
    postcode: v.string(),
    lat: v.number(),
    lng: v.number(),
    source: v.string(),
  },
  returns: v.id("pings"),
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + PRESENCE_TTL_MS;

    // Insert ping for stats
    const pingId = await ctx.db.insert("pings", args);

    // Upsert presence signal for heat map
    const existing = await ctx.db
      .query("presenceSignals")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lat: args.lat,
        lng: args.lng,
        intensity: 1.0,
        expiresAt,
      });
    } else {
      await ctx.db.insert("presenceSignals", {
        deviceId: args.deviceId,
        lat: args.lat,
        lng: args.lng,
        intensity: 1.0,
        expiresAt,
      });
    }

    return pingId;
  },
});
