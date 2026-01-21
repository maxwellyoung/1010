import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ZONE } from '../config/NetworkZones';
import * as Crypto from 'expo-crypto';

/**
 * Pattern Walk Creator Hook
 *
 * Allows users to create and save their own pattern walks.
 * "Draw your path through the field. The network will remember it."
 */

export interface WalkPoint {
    x: number; // Screen coordinates
    y: number;
    lat?: number;
    lng?: number;
    timestamp: number;
}

export interface PatternWalk {
    id: string;
    name: string;
    description?: string;
    points: WalkPoint[];
    duration: number; // estimated duration in ms
    distance: number; // estimated distance in meters
    createdAt: number;
    isShared: boolean;
    creatorId?: string;
}

const SIZE = 300;

// Convert screen coordinates to geographic coordinates
const xToLng = (x: number): number => {
    const normalized = x / SIZE;
    return DEFAULT_ZONE.bounds.minLng + normalized * (DEFAULT_ZONE.bounds.maxLng - DEFAULT_ZONE.bounds.minLng);
};

const yToLat = (y: number): number => {
    const normalized = 1 - y / SIZE;
    return DEFAULT_ZONE.bounds.minLat + normalized * (DEFAULT_ZONE.bounds.maxLat - DEFAULT_ZONE.bounds.minLat);
};

const WALKS_CACHE_KEY = '@network1010/pattern_walks';
const WALK_NAMES = [
    'Morning Drift',
    'Evening Circuit',
    'Quiet Loop',
    'Signal Path',
    'City Breath Walk',
    'Memory Lane',
    'Resonance Route',
    'Echo Trail',
];

const estimateDistance = (points: WalkPoint[]): number => {
    if (points.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        // Rough conversion: 1 screen unit ≈ 15 meters in our network bounds
        total += Math.sqrt(dx * dx + dy * dy) * 15;
    }
    return Math.round(total);
};

const estimateDuration = (distance: number): number => {
    // Average walking speed: 5 km/h = 83 m/min
    const minutes = distance / 83;
    return Math.round(minutes * 60 * 1000); // ms
};

export function usePatternWalkCreator() {
    const [isRecording, setIsRecording] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<WalkPoint[]>([]);
    const [savedWalks, setSavedWalks] = useState<PatternWalk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const recordStartRef = useRef<number | null>(null);

    // Convex mutation
    const insertPatternWalk = useMutation(api.mutations.patternWalks.insertPatternWalk);

    // Initialize device ID
    useEffect(() => {
        if (isConvexConfigured) {
            getDeviceId().then(setDeviceId);
        }
    }, []);

    // Load saved walks on mount
    useEffect(() => {
        const loadWalks = async () => {
            try {
                const cached = await AsyncStorage.getItem(WALKS_CACHE_KEY);
                if (cached) {
                    setSavedWalks(JSON.parse(cached));
                }
            } catch (err) {
                console.warn('[WALK] Load failed:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadWalks();
    }, []);

    // Start recording a new walk
    const startRecording = useCallback(() => {
        setCurrentPoints([]);
        setIsRecording(true);
        recordStartRef.current = Date.now();
    }, []);

    // Add a point to the current walk
    const addPoint = useCallback((x: number, y: number) => {
        if (!isRecording) return;

        const point: WalkPoint = {
            x,
            y,
            lat: yToLat(y),
            lng: xToLng(x),
            timestamp: Date.now(),
        };

        setCurrentPoints(prev => {
            // Don't add if too close to last point
            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const dx = x - last.x;
                const dy = y - last.y;
                if (Math.sqrt(dx * dx + dy * dy) < 5) {
                    return prev;
                }
            }
            return [...prev, point];
        });
    }, [isRecording]);

    // Stop recording
    const stopRecording = useCallback(() => {
        setIsRecording(false);
        recordStartRef.current = null;
    }, []);

    // Clear current recording
    const clearRecording = useCallback(() => {
        setCurrentPoints([]);
        setIsRecording(false);
        recordStartRef.current = null;
    }, []);

    // Save the current walk
    const saveWalk = useCallback(async (name?: string, description?: string): Promise<PatternWalk | null> => {
        if (currentPoints.length < 3) {
            console.warn('[WALK] Not enough points to save');
            return null;
        }

        const distance = estimateDistance(currentPoints);
        const duration = estimateDuration(distance);
        const walkId = await Crypto.randomUUID();

        const walk: PatternWalk = {
            id: walkId,
            name: name || WALK_NAMES[Math.floor(Math.random() * WALK_NAMES.length)],
            description,
            points: currentPoints,
            duration,
            distance,
            createdAt: Date.now(),
            isShared: false,
        };

        // Save locally
        const updated = [...savedWalks, walk];
        setSavedWalks(updated);

        try {
            await AsyncStorage.setItem(WALKS_CACHE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.warn('[WALK] Save failed:', err);
        }

        // Clear current recording
        clearRecording();

        return walk;
    }, [currentPoints, savedWalks, clearRecording]);

    // Delete a saved walk
    const deleteWalk = useCallback(async (walkId: string) => {
        const updated = savedWalks.filter(w => w.id !== walkId);
        setSavedWalks(updated);

        try {
            await AsyncStorage.setItem(WALKS_CACHE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.warn('[WALK] Delete failed:', err);
        }
    }, [savedWalks]);

    // Share a walk to the network
    const shareWalk = useCallback(async (walkId: string): Promise<boolean> => {
        if (!isConvexConfigured || !deviceId) return false;

        const walk = savedWalks.find(w => w.id === walkId);
        if (!walk) return false;

        try {
            // Upload to Convex
            await insertPatternWalk({
                id: walk.id,
                createdBy: deviceId,
                name: walk.name,
                description: walk.description,
                points: walk.points,
                durationMs: walk.duration,
                distanceMeters: walk.distance,
                isShared: true,
            });

            // Update local state
            const updated = savedWalks.map(w =>
                w.id === walkId ? { ...w, isShared: true, creatorId: deviceId } : w
            );
            setSavedWalks(updated);
            await AsyncStorage.setItem(WALKS_CACHE_KEY, JSON.stringify(updated));

            console.log('[WALK] Walk shared to network');
            return true;
        } catch (err) {
            console.error('[WALK] Share failed:', err);
            return false;
        }
    }, [deviceId, savedWalks, insertPatternWalk]);

    // Current walk stats
    const currentStats = useMemo(() => {
        const distance = estimateDistance(currentPoints);
        return {
            pointCount: currentPoints.length,
            distance,
            duration: estimateDuration(distance),
            isValid: currentPoints.length >= 3,
        };
    }, [currentPoints]);

    return {
        // Recording state
        isRecording,
        currentPoints,
        currentStats,

        // Recording actions
        startRecording,
        addPoint,
        stopRecording,
        clearRecording,
        saveWalk,

        // Saved walks
        savedWalks,
        isLoading,
        deleteWalk,
        shareWalk,
    };
}

export type PatternWalkCreator = ReturnType<typeof usePatternWalkCreator>;
