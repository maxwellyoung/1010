import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../context/LocationContext';
import { DEFAULT_ZONE, coordsToNormalized } from '../config/NetworkZones';

/**
 * Exploration System - Journey-inspired
 *
 * The field begins shrouded.
 * Where you walk, light follows.
 * Your trails reveal the territory.
 */

const STORAGE_KEY = '@exploration_grid';
const GRID_SIZE = 16; // 16x16 grid of exploration cells
const REVEAL_RADIUS = 1.5; // Reveal cells within this normalized radius

export interface ExplorationCell {
    x: number; // Grid coordinate 0-15
    y: number;
    revealed: boolean;
    firstVisit?: number; // Timestamp
    visitCount: number;
}

export interface ExplorationState {
    cells: Map<string, ExplorationCell>;
    totalRevealed: number;
    percentRevealed: number;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

const initializeGrid = (): Map<string, ExplorationCell> => {
    const cells = new Map<string, ExplorationCell>();
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            cells.set(cellKey(x, y), {
                x,
                y,
                revealed: false,
                visitCount: 0,
            });
        }
    }
    return cells;
};

// Convert normalized position (-1 to 1) to grid coordinate (0 to GRID_SIZE-1)
const normalizedToGrid = (norm: number): number => {
    const clamped = Math.max(-1, Math.min(1, norm));
    return Math.floor(((clamped + 1) / 2) * (GRID_SIZE - 0.001));
};

// Convert grid coordinate to normalized center position
const gridToNormalized = (grid: number): number => {
    return ((grid + 0.5) / GRID_SIZE) * 2 - 1;
};

export const useExploration = () => {
    const { location, isInsideNetwork } = useLocation();
    const [cells, setCells] = useState<Map<string, ExplorationCell>>(() => initializeGrid());
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load persisted exploration data
    useEffect(() => {
        const load = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored) as Array<[string, ExplorationCell]>;
                    const loaded = new Map(data);
                    // Merge with initialized grid (in case grid size changed)
                    const merged = initializeGrid();
                    for (const [key, cell] of loaded) {
                        if (merged.has(key)) {
                            merged.set(key, cell);
                        }
                    }
                    setCells(merged);
                }
            } catch (err) {
                console.warn('[EXPLORATION] Failed to load:', err);
            } finally {
                setIsLoaded(true);
            }
        };
        load();
    }, []);

    // Debounced save to storage
    const save = useCallback((cellsToSave: Map<string, ExplorationCell>) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const data = Array.from(cellsToSave.entries());
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (err) {
                console.warn('[EXPLORATION] Failed to save:', err);
            }
        }, 2000);
    }, []);

    // Reveal cells around current position
    const revealAtPosition = useCallback((normX: number, normY: number) => {
        const gridX = normalizedToGrid(normX);
        const gridY = normalizedToGrid(normY);
        const now = Date.now();

        setCells(prev => {
            const next = new Map(prev);
            let changed = false;

            // Reveal cells within radius
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const cx = gridX + dx;
                    const cy = gridY + dy;
                    if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;

                    const key = cellKey(cx, cy);
                    const cell = next.get(key);
                    if (cell) {
                        if (!cell.revealed) {
                            next.set(key, {
                                ...cell,
                                revealed: true,
                                firstVisit: now,
                                visitCount: 1,
                            });
                            changed = true;
                        } else if (cx === gridX && cy === gridY) {
                            // Increment visit count for current cell
                            next.set(key, {
                                ...cell,
                                visitCount: cell.visitCount + 1,
                            });
                        }
                    }
                }
            }

            if (changed) {
                save(next);
            }
            return next;
        });
    }, [save]);

    // Track exploration as user moves
    useEffect(() => {
        if (!isLoaded || !isInsideNetwork || !location) return;

        const { latitude, longitude } = location.coords;
        const normalized = coordsToNormalized(latitude, longitude, DEFAULT_ZONE);
        revealAtPosition(normalized.x, normalized.y);
    }, [location?.coords.latitude, location?.coords.longitude, isInsideNetwork, isLoaded, revealAtPosition]);

    // Computed stats
    const stats = useMemo(() => {
        let revealed = 0;
        for (const cell of cells.values()) {
            if (cell.revealed) revealed++;
        }
        const total = GRID_SIZE * GRID_SIZE;
        return {
            totalRevealed: revealed,
            totalCells: total,
            percentRevealed: Math.round((revealed / total) * 100),
        };
    }, [cells]);

    // Get fog opacity for a normalized position (0 = revealed, 1 = fog)
    const getFogOpacity = useCallback((normX: number, normY: number): number => {
        const gridX = normalizedToGrid(normX);
        const gridY = normalizedToGrid(normY);
        const cell = cells.get(cellKey(gridX, gridY));
        return cell?.revealed ? 0 : 1;
    }, [cells]);

    // Get array of unrevealed cells for fog rendering
    const fogCells = useMemo(() => {
        const unrevealed: Array<{ x: number; y: number; normX: number; normY: number }> = [];
        for (const cell of cells.values()) {
            if (!cell.revealed) {
                unrevealed.push({
                    x: cell.x,
                    y: cell.y,
                    normX: gridToNormalized(cell.x),
                    normY: gridToNormalized(cell.y),
                });
            }
        }
        return unrevealed;
    }, [cells]);

    // Reset exploration (for debug/testing)
    const resetExploration = useCallback(async () => {
        const fresh = initializeGrid();
        setCells(fresh);
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            console.warn('[EXPLORATION] Failed to reset:', err);
        }
    }, []);

    return {
        cells,
        stats,
        fogCells,
        isLoaded,
        getFogOpacity,
        resetExploration,
        gridSize: GRID_SIZE,
    };
};
