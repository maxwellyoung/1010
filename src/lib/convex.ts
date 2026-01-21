import { ConvexReactClient } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";

// Convex configuration
const convexUrl =
  Constants.expoConfig?.extra?.convexUrl || process.env.EXPO_PUBLIC_CONVEX_URL;

export const isConvexConfigured = Boolean(convexUrl);

// Create the Convex client
export const convex = isConvexConfigured
  ? new ConvexReactClient(convexUrl!)
  : null;

// Device ID management for anonymous identity
const DEVICE_ID_KEY = "@network1010/device_id";

let cachedDeviceId: string | null = null;

/**
 * Get or create a persistent device ID.
 * This replaces Supabase anonymous auth with a simpler device-based identity.
 */
export const getDeviceId = async (): Promise<string> => {
  // Return cached value if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // Try to load existing device ID
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }

    // Generate new device ID
    const newId = await Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    console.log("[CONVEX] Generated new device ID");
    return newId;
  } catch (err) {
    // Fallback to in-memory UUID if storage fails
    console.warn("[CONVEX] Storage failed, using temporary ID:", err);
    const tempId = await Crypto.randomUUID();
    cachedDeviceId = tempId;
    return tempId;
  }
};

/**
 * Clear the cached device ID (for testing)
 */
export const clearDeviceIdCache = () => {
  cachedDeviceId = null;
};

/**
 * Hook to get device ID synchronously after initialization
 */
export const getCachedDeviceId = (): string | null => {
  return cachedDeviceId;
};

/**
 * Initialize device ID at app startup
 */
export const initializeDeviceId = async (): Promise<string> => {
  const deviceId = await getDeviceId();
  console.log("[CONVEX] Device ID initialized");
  return deviceId;
};
