import { query } from "../_generated/server";
import { v } from "convex/values";

const walkPointValidator = v.object({
  x: v.number(),
  y: v.number(),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  timestamp: v.number(),
});

const walkValidator = v.object({
  id: v.id("patternWalks"),
  name: v.string(),
  description: v.optional(v.string()),
  points: v.array(walkPointValidator),
  durationMs: v.number(),
  distanceMeters: v.number(),
  isShared: v.boolean(),
  createdAt: v.number(),
});

// Get walks created by a device
export const getWalksByCreator = query({
  args: {
    createdBy: v.string(),
  },
  returns: v.array(walkValidator),
  handler: async (ctx, args) => {
    const walks = await ctx.db
      .query("patternWalks")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.createdBy))
      .collect();

    return walks.map((w) => ({
      id: w._id,
      name: w.name,
      description: w.description,
      points: w.points,
      durationMs: w.durationMs,
      distanceMeters: w.distanceMeters,
      isShared: w.isShared,
      createdAt: w._creationTime,
    }));
  },
});

// Get shared walks
export const getSharedWalks = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("patternWalks"),
      name: v.string(),
      description: v.optional(v.string()),
      points: v.array(walkPointValidator),
      durationMs: v.number(),
      distanceMeters: v.number(),
      createdBy: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const walks = await ctx.db
      .query("patternWalks")
      .withIndex("by_shared", (q) => q.eq("isShared", true))
      .collect();

    return walks.map((w) => ({
      id: w._id,
      name: w.name,
      description: w.description,
      points: w.points,
      durationMs: w.durationMs,
      distanceMeters: w.distanceMeters,
      createdBy: w.createdBy,
      createdAt: w._creationTime,
    }));
  },
});
