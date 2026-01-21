import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Insert an encounter
export const insertEncounter = mutation({
  args: {
    deviceA: v.string(),
    deviceB: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    durationMs: v.number(),
    maxResonance: v.number(),
    ritualTriggered: v.boolean(),
  },
  returns: v.id("encounters"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("encounters", args);
  },
});

// Mark an encounter as having triggered a ritual
export const markRitualTriggered = mutation({
  args: {
    encounterId: v.id("encounters"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.encounterId, {
      ritualTriggered: true,
    });
    return null;
  },
});
