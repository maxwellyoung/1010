import { query } from "../_generated/server";
import { v } from "convex/values";

// Get encounter frequency for a device (replaces encounter_frequency view)
export const getEncounterFrequency = query({
  args: {
    deviceId: v.string(),
  },
  returns: v.array(
    v.object({
      encounterHash: v.string(),
      peerId: v.string(),
      encounterCount: v.number(),
      lastEncounter: v.number(),
      hasRitual: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Get encounters where this device is involved
    const encountersA = await ctx.db
      .query("encounters")
      .withIndex("by_device_a", (q) => q.eq("deviceA", args.deviceId))
      .collect();

    const encountersB = await ctx.db
      .query("encounters")
      .withIndex("by_device_b", (q) => q.eq("deviceB", args.deviceId))
      .collect();

    // Combine and group by peer
    const peerEncounters = new Map<
      string,
      {
        count: number;
        lastEncounter: number;
        hasRitual: boolean;
      }
    >();

    for (const enc of encountersA) {
      const existing = peerEncounters.get(enc.deviceB) || {
        count: 0,
        lastEncounter: 0,
        hasRitual: false,
      };
      existing.count++;
      existing.lastEncounter = Math.max(existing.lastEncounter, enc._creationTime);
      existing.hasRitual = existing.hasRitual || enc.ritualTriggered;
      peerEncounters.set(enc.deviceB, existing);
    }

    for (const enc of encountersB) {
      const existing = peerEncounters.get(enc.deviceA) || {
        count: 0,
        lastEncounter: 0,
        hasRitual: false,
      };
      existing.count++;
      existing.lastEncounter = Math.max(existing.lastEncounter, enc._creationTime);
      existing.hasRitual = existing.hasRitual || enc.ritualTriggered;
      peerEncounters.set(enc.deviceA, existing);
    }

    // Convert to array format matching Supabase view
    return Array.from(peerEncounters.entries()).map(([peerId, data]) => ({
      encounterHash: `${args.deviceId}-${peerId}`,
      peerId,
      encounterCount: data.count,
      lastEncounter: data.lastEncounter,
      hasRitual: data.hasRitual,
    }));
  },
});

// Get recent encounters for a device
export const getRecentEncounters = query({
  args: {
    deviceId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.id("encounters"),
      peerId: v.string(),
      at: v.number(),
      durationMs: v.number(),
      maxResonance: v.number(),
      ritualTriggered: v.boolean(),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const encountersA = await ctx.db
      .query("encounters")
      .withIndex("by_device_a", (q) => q.eq("deviceA", args.deviceId))
      .order("desc")
      .take(limit);

    const encountersB = await ctx.db
      .query("encounters")
      .withIndex("by_device_b", (q) => q.eq("deviceB", args.deviceId))
      .order("desc")
      .take(limit);

    // Combine and sort
    const all = [...encountersA, ...encountersB]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit);

    return all.map((enc) => ({
      id: enc._id,
      peerId: enc.deviceA === args.deviceId ? enc.deviceB : enc.deviceA,
      at: enc._creationTime,
      durationMs: enc.durationMs,
      maxResonance: enc.maxResonance,
      ritualTriggered: enc.ritualTriggered,
      lat: enc.lat,
      lng: enc.lng,
    }));
  },
});

// Get encounters in a time range (for temporal layers)
export const getEncountersInRange = query({
  args: {
    since: v.number(),
  },
  returns: v.array(
    v.object({
      id: v.id("encounters"),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
      createdAt: v.number(),
      maxResonance: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const encounters = await ctx.db
      .query("encounters")
      .filter((q) => q.gte(q.field("_creationTime"), args.since))
      .collect();

    return encounters.map((enc) => ({
      id: enc._id,
      lat: enc.lat,
      lng: enc.lng,
      createdAt: enc._creationTime,
      maxResonance: enc.maxResonance,
    }));
  },
});
