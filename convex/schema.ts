import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Activity heartbeats for stats
  pings: defineTable({
    deviceId: v.string(),
    postcode: v.string(),
    lat: v.number(),
    lng: v.number(),
    source: v.string(),
  })
    .index("by_device", ["deviceId"])
    .index("by_postcode", ["postcode"]),

  // Heat map data (15-min TTL handled via expiresAt)
  presenceSignals: defineTable({
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    intensity: v.number(),
    expiresAt: v.number(), // Unix timestamp for TTL
  })
    .index("by_device", ["deviceId"])
    .index("by_expiry", ["expiresAt"])
    .index("by_location", ["lat", "lng"]),

  // Movement history (7-day retention)
  trails: defineTable({
    deviceId: v.string(),
    sessionId: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
    seq: v.number(),
  })
    .index("by_device_session", ["deviceId", "sessionId"])
    .index("by_device", ["deviceId"]),

  // Peer proximity events
  encounters: defineTable({
    deviceA: v.string(),
    deviceB: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    durationMs: v.number(),
    maxResonance: v.number(),
    ritualTriggered: v.boolean(),
  })
    .index("by_device_a", ["deviceA"])
    .index("by_device_b", ["deviceB"]),

  // Shared serendipity events
  windowMoments: defineTable({
    startedAt: v.number(),
    endsAt: v.number(),
    positionX: v.number(),
    positionY: v.number(),
    triggeredBy: v.string(),
    participantCount: v.number(),
  }),

  // User-created walking routes
  patternWalks: defineTable({
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
  })
    .index("by_creator", ["createdBy"])
    .index("by_shared", ["isShared"]),

  // Ephemeral broadcasts (ghost pings, window announcements)
  broadcasts: defineTable({
    type: v.union(v.literal("ghost"), v.literal("window"), v.literal("density")),
    deviceId: v.string(),
    payload: v.any(),
    expiresAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_expiry", ["expiresAt"]),

  // Presence heartbeats for online count
  presence: defineTable({
    deviceId: v.string(),
    cellId: v.optional(v.string()),
    lastSeen: v.number(),
  })
    .index("by_device", ["deviceId"])
    .index("by_cell", ["cellId"])
    .index("by_last_seen", ["lastSeen"]),
});
