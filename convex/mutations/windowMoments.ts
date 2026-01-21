import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Insert a window moment
export const insertWindowMoment = mutation({
  args: {
    startedAt: v.number(),
    endsAt: v.number(),
    positionX: v.number(),
    positionY: v.number(),
    triggeredBy: v.string(),
    participantCount: v.number(),
  },
  returns: v.id("windowMoments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("windowMoments", args);
  },
});
