import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Insert a pattern walk
export const insertPatternWalk = mutation({
  args: {
    id: v.optional(v.string()), // Optional custom ID (ignored, Convex generates IDs)
    createdBy: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    points: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        timestamp: v.number(),
      })
    ),
    durationMs: v.number(),
    distanceMeters: v.number(),
    isShared: v.boolean(),
  },
  returns: v.id("patternWalks"),
  handler: async (ctx, args) => {
    const { id: _customId, ...walkData } = args;
    return await ctx.db.insert("patternWalks", walkData);
  },
});

// Update a pattern walk to be shared
export const sharePatternWalk = mutation({
  args: {
    walkId: v.id("patternWalks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.walkId, {
      isShared: true,
    });
    return null;
  },
});

// Delete a pattern walk
export const deletePatternWalk = mutation({
  args: {
    walkId: v.id("patternWalks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.walkId);
    return null;
  },
});
