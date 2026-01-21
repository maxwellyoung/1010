import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Resonance Memory Hook
 *
 * Tracks encounter history to recognize "familiar signals" - peers you've
 * crossed paths with multiple times. The network remembers without revealing identity.
 *
 * Memory Levels:
 * - 0: Unknown signal (first encounter)
 * - 1: Passing signal (2-3 encounters)
 * - 2: Familiar signal (4-6 encounters)
 * - 3: Resonant signal (7+ encounters)
 */

export type MemoryLevel = 0 | 1 | 2 | 3;

export interface SignalMemory {
    peerId: string;
    encounterCount: number;
    lastEncounter: number;
    hasRitual: boolean;
    memoryLevel: MemoryLevel;
}

const MEMORY_CACHE_KEY = '@network1010/resonance_memory';
const MEMORY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getMemoryLevel = (count: number): MemoryLevel => {
    if (count >= 7) return 3;
    if (count >= 4) return 2;
    if (count >= 2) return 1;
    return 0;
};

const getMemoryLabel = (level: MemoryLevel): string => {
    switch (level) {
        case 3: return 'Resonant signal';
        case 2: return 'Familiar signal';
        case 1: return 'Passing signal';
        default: return 'Unknown signal';
    }
};

const getMemoryPhrase = (level: MemoryLevel): string | null => {
    switch (level) {
        case 3: return 'The city knows you both.';
        case 2: return 'Paths cross again.';
        case 1: return 'A signal returns.';
        default: return null;
    }
};

export function useResonanceMemory() {
    const [memories, setMemories] = useState<Map<string, SignalMemory>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    // Initialize device ID
    useEffect(() => {
        const init = async () => {
            if (isConvexConfigured) {
                const id = await getDeviceId();
                setDeviceId(id);
            }
        };
        init();
    }, []);

    // Convex query for encounter frequency
    const encounterFrequency = useQuery(
        api.queries.encounters.getEncounterFrequency,
        deviceId && isConvexConfigured ? { deviceId } : 'skip'
    );

    // Load cached memory on mount
    useEffect(() => {
        const loadCache = async () => {
            try {
                const cached = await AsyncStorage.getItem(MEMORY_CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < MEMORY_CACHE_TTL) {
                        const memoryMap = new Map<string, SignalMemory>(
                            data.map((m: SignalMemory) => [m.peerId, m])
                        );
                        setMemories(memoryMap);
                        setLastSync(timestamp);
                    }
                }
            } catch (err) {
                console.warn('[MEMORY] Cache load failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCache();
    }, []);

    // Process encounter frequency data from Convex
    useEffect(() => {
        if (!encounterFrequency || !deviceId) return;

        const processData = async () => {
            const newMemories = new Map<string, SignalMemory>();

            for (const freq of encounterFrequency) {
                const memory: SignalMemory = {
                    peerId: freq.peerId,
                    encounterCount: freq.encounterCount,
                    lastEncounter: freq.lastEncounter,
                    hasRitual: freq.hasRitual,
                    memoryLevel: getMemoryLevel(freq.encounterCount),
                };
                newMemories.set(freq.peerId, memory);
            }

            setMemories(newMemories);
            setLastSync(Date.now());

            // Cache for offline use
            const cacheData = {
                data: Array.from(newMemories.values()),
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(cacheData));

            console.log('[MEMORY] Synced', newMemories.size, 'memories');
        };

        processData();
    }, [encounterFrequency, deviceId]);

    // Get memory for a specific peer
    const getMemory = useCallback((peerId: string): SignalMemory | null => {
        return memories.get(peerId) ?? null;
    }, [memories]);

    // Check if a peer is familiar (2+ encounters)
    const isFamiliar = useCallback((peerId: string): boolean => {
        const memory = memories.get(peerId);
        return memory ? memory.memoryLevel >= 1 : false;
    }, [memories]);

    // Check if a peer is resonant (7+ encounters)
    const isResonant = useCallback((peerId: string): boolean => {
        const memory = memories.get(peerId);
        return memory ? memory.memoryLevel >= 3 : false;
    }, [memories]);

    // Get phrase for peer's memory level
    const getPhrase = useCallback((peerId: string): string | null => {
        const memory = memories.get(peerId);
        if (!memory) return null;
        return getMemoryPhrase(memory.memoryLevel);
    }, [memories]);

    // Record a new encounter locally (optimistic update)
    const recordEncounter = useCallback((peerId: string, hasRitual: boolean = false) => {
        setMemories(prev => {
            const existing = prev.get(peerId);
            const newCount = (existing?.encounterCount ?? 0) + 1;

            const updated: SignalMemory = {
                peerId,
                encounterCount: newCount,
                lastEncounter: Date.now(),
                hasRitual: hasRitual || (existing?.hasRitual ?? false),
                memoryLevel: getMemoryLevel(newCount),
            };

            const newMap = new Map(prev);
            newMap.set(peerId, updated);
            return newMap;
        });
    }, []);

    // Manual sync function (Convex auto-syncs, but keep for API compatibility)
    const syncWithServer = useCallback(() => {
        // Convex handles this automatically
    }, []);

    // Stats
    const stats = useMemo(() => {
        const all = Array.from(memories.values());
        return {
            total: all.length,
            familiar: all.filter(m => m.memoryLevel >= 2).length,
            resonant: all.filter(m => m.memoryLevel >= 3).length,
            withRitual: all.filter(m => m.hasRitual).length,
        };
    }, [memories]);

    return {
        memories: Array.from(memories.values()),
        isLoading,
        lastSync,
        getMemory,
        isFamiliar,
        isResonant,
        getPhrase,
        recordEncounter,
        syncWithServer,
        stats,
        getMemoryLabel,
    };
}

export type ResonanceMemory = ReturnType<typeof useResonanceMemory>;
