import { mutation } from "../_generated/server";
import { v } from "convex/values";

const GHOST_TTL_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DENSITY_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Send a ghost ping broadcast
export const sendGhostPing = mutation({
  args: {
    deviceId: v.string(),
    payload: v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      ageMinutes: v.number(),
    }),
  },
  returns: v.id("broadcasts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("broadcasts", {
      type: "ghost",
      deviceId: args.deviceId,
      payload: args.payload,
      expiresAt: Date.now() + GHOST_TTL_MS,
    });
  },
});

// Send a window moment broadcast
export const sendWindowBroadcast = mutation({
  args: {
    deviceId: v.string(),
    payload: v.object({
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
  },
  returns: v.id("broadcasts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("broadcasts", {
      type: "window",
      deviceId: args.deviceId,
      payload: args.payload,
      expiresAt: Date.now() + WINDOW_TTL_MS,
    });
  },
});

// Send a density ping for a cell
export const sendDensityPing = mutation({
  args: {
    deviceId: v.string(),
    cellId: v.string(),
  },
  returns: v.id("broadcasts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("broadcasts", {
      type: "density",
      deviceId: args.deviceId,
      payload: { cellId: args.cellId, at: Date.now() },
      expiresAt: Date.now() + DENSITY_TTL_MS,
    });
  },
});
