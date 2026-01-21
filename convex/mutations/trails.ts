import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Insert a trail point
export const insertTrailPoint = mutation({
  args: {
    deviceId: v.string(),
    sessionId: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
    seq: v.number(),
  },
  returns: v.id("trails"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("trails", args);
  },
});

// Batch insert trail points (for efficiency)
export const insertTrailPoints = mutation({
  args: {
    points: v.array(
      v.object({
        deviceId: v.string(),
        sessionId: v.string(),
        lat: v.number(),
        lng: v.number(),
        accuracy: v.number(),
        seq: v.number(),
      })
    ),
  },
  returns: v.array(v.id("trails")),
  handler: async (ctx, args) => {
    const ids = [];
    for (const point of args.points) {
      const id = await ctx.db.insert("trails", point);
      ids.push(id);
    }
    return ids;
  },
});
