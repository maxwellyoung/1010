import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Update presence (heartbeat)
export const updatePresence = mutation({
  args: {
    deviceId: v.string(),
    cellId: v.optional(v.string()),
  },
  returns: v.id("presence"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing presence
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cellId: args.cellId,
        lastSeen: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("presence", {
      deviceId: args.deviceId,
      cellId: args.cellId,
      lastSeen: now,
    });
  },
});

// Remove presence (disconnect)
export const removePresence = mutation({
  args: {
    deviceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
