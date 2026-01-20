/**
 * Core Business Logic Tests
 *
 * Tests for the fundamental calculations and rules of the 1010 Network.
 */

describe('Network Bounds', () => {
    const NETWORK_BOUNDS = {
        minLat: -36.870,
        maxLat: -36.830,
        minLng: 174.750,
        maxLng: 174.785,
    };

    const isInsideNetwork = (lat: number, lng: number): boolean => {
        return (
            lat >= NETWORK_BOUNDS.minLat &&
            lat <= NETWORK_BOUNDS.maxLat &&
            lng >= NETWORK_BOUNDS.minLng &&
            lng <= NETWORK_BOUNDS.maxLng
        );
    };

    test('Auckland CBD center is inside network', () => {
        expect(isInsideNetwork(-36.848, 174.763)).toBe(true);
    });

    test('Britomart is inside network', () => {
        expect(isInsideNetwork(-36.843, 174.767)).toBe(true);
    });

    test('Sky Tower is inside network', () => {
        expect(isInsideNetwork(-36.848, 174.762)).toBe(true);
    });

    test('Ponsonby is outside network', () => {
        expect(isInsideNetwork(-36.860, 174.740)).toBe(false);
    });

    test('North Shore is outside network', () => {
        expect(isInsideNetwork(-36.800, 174.770)).toBe(false);
    });
});

describe('Resonance Calculation', () => {
    const calculateResonance = (distance: number): number => {
        if (distance < 0) return 0;
        const normalized = 1 - Math.min(distance / 3, 1);
        return Math.max(0, normalized);
    };

    test('distance 0 gives maximum resonance', () => {
        expect(calculateResonance(0)).toBe(1);
    });

    test('distance 1.5m gives 50% resonance', () => {
        expect(calculateResonance(1.5)).toBe(0.5);
    });

    test('distance 3m+ gives 0 resonance', () => {
        expect(calculateResonance(3)).toBe(0);
        expect(calculateResonance(5)).toBe(0);
    });

    test('negative distance gives 0 resonance', () => {
        expect(calculateResonance(-1)).toBe(0);
    });
});

describe('Quiet Ritual Conditions', () => {
    const RITUAL_THRESHOLD = {
        distance: 1.2, // meters
        resonance: 0.6, // 60%
        duration: 4200, // ms
    };

    const shouldTriggerRitual = (
        distance: number,
        resonance: number,
        durationMs: number
    ): boolean => {
        return (
            distance <= RITUAL_THRESHOLD.distance &&
            resonance >= RITUAL_THRESHOLD.resonance &&
            durationMs >= RITUAL_THRESHOLD.duration
        );
    };

    test('close proximity with high resonance triggers after 4.2s', () => {
        expect(shouldTriggerRitual(1.0, 0.7, 4200)).toBe(true);
    });

    test('close proximity does not trigger before 4.2s', () => {
        expect(shouldTriggerRitual(1.0, 0.7, 4000)).toBe(false);
    });

    test('too far does not trigger ritual', () => {
        expect(shouldTriggerRitual(1.5, 0.7, 5000)).toBe(false);
    });

    test('low resonance does not trigger ritual', () => {
        expect(shouldTriggerRitual(1.0, 0.5, 5000)).toBe(false);
    });
});

describe('City Breath Period', () => {
    const calculateBreathPeriod = (densityScore: number, hourOfDay: number): number => {
        const BASE_PERIOD = 6000;
        const MIN_PERIOD = 3200;
        const MAX_PERIOD = 9000;

        // Time factor: slower at night (10pm-6am), faster midday
        let timeFactor = 1.0;
        if (hourOfDay >= 22 || hourOfDay < 6) {
            timeFactor = 1.4; // Slower at night
        } else if (hourOfDay >= 11 && hourOfDay <= 14) {
            timeFactor = 0.7; // Faster at midday
        }

        // Density factor: more people = faster pulse
        const densityFactor = 1 - (densityScore / 4) * 0.4;

        const period = Math.round(BASE_PERIOD * timeFactor * densityFactor);
        return Math.max(MIN_PERIOD, Math.min(MAX_PERIOD, period));
    };

    test('busy midday has faster breath', () => {
        const busyMidday = calculateBreathPeriod(4, 12);
        const quietMidday = calculateBreathPeriod(0, 12);
        expect(busyMidday).toBeLessThan(quietMidday);
    });

    test('night has slower breath than day', () => {
        const night = calculateBreathPeriod(2, 2);
        const day = calculateBreathPeriod(2, 14);
        expect(night).toBeGreaterThan(day);
    });

    test('period stays within bounds', () => {
        expect(calculateBreathPeriod(4, 12)).toBeGreaterThanOrEqual(3200);
        expect(calculateBreathPeriod(0, 3)).toBeLessThanOrEqual(9000);
    });
});

describe('Ghost Ping Age', () => {
    const MAX_AGE_MINUTES = 15;

    const isGhostPingValid = (ageMinutes: number): boolean => {
        return ageMinutes > 0 && ageMinutes <= MAX_AGE_MINUTES;
    };

    const calculateGhostOpacity = (ageMinutes: number): number => {
        if (!isGhostPingValid(ageMinutes)) return 0;
        return Math.max(0.15, 0.4 * (1 - ageMinutes / MAX_AGE_MINUTES));
    };

    test('recent ping is valid', () => {
        expect(isGhostPingValid(5)).toBe(true);
    });

    test('old ping is invalid', () => {
        expect(isGhostPingValid(20)).toBe(false);
    });

    test('fresh ping has higher opacity', () => {
        expect(calculateGhostOpacity(1)).toBeGreaterThan(calculateGhostOpacity(14));
    });

    test('opacity stays above minimum', () => {
        expect(calculateGhostOpacity(14)).toBeGreaterThanOrEqual(0.15);
    });
});

describe('Coordinate Conversion', () => {
    const NETWORK_BOUNDS = {
        minLat: -36.870,
        maxLat: -36.830,
        minLng: 174.750,
        maxLng: 174.785,
    };

    const latToY = (lat: number): number => {
        const normalized = (lat - NETWORK_BOUNDS.minLat) / (NETWORK_BOUNDS.maxLat - NETWORK_BOUNDS.minLat);
        return (normalized * 2 - 1) * -1;
    };

    const lngToX = (lng: number): number => {
        const normalized = (lng - NETWORK_BOUNDS.minLng) / (NETWORK_BOUNDS.maxLng - NETWORK_BOUNDS.minLng);
        return normalized * 2 - 1;
    };

    test('center of bounds maps to origin', () => {
        const centerLat = (NETWORK_BOUNDS.minLat + NETWORK_BOUNDS.maxLat) / 2;
        const centerLng = (NETWORK_BOUNDS.minLng + NETWORK_BOUNDS.maxLng) / 2;
        expect(latToY(centerLat)).toBeCloseTo(0, 5);
        expect(lngToX(centerLng)).toBeCloseTo(0, 5);
    });

    test('coordinates map to -1 to 1 range', () => {
        expect(latToY(NETWORK_BOUNDS.maxLat)).toBeCloseTo(-1, 5);
        expect(latToY(NETWORK_BOUNDS.minLat)).toBeCloseTo(1, 5);
        expect(lngToX(NETWORK_BOUNDS.minLng)).toBeCloseTo(-1, 5);
        expect(lngToX(NETWORK_BOUNDS.maxLng)).toBeCloseTo(1, 5);
    });
});

describe('Window Moment Timing', () => {
    const WINDOW_DURATION_MS = 7 * 60 * 1000;
    const MIN_INTERVAL_MS = 30 * 60 * 1000;

    const canTriggerWindow = (
        lastWindowTime: number,
        currentTime: number,
        isWindowOpen: boolean,
        peerCount: number
    ): boolean => {
        if (isWindowOpen) return false;
        if (peerCount < 2) return false;
        if (currentTime - lastWindowTime < MIN_INTERVAL_MS) return false;
        return true;
    };

    test('cannot trigger with less than 2 peers', () => {
        expect(canTriggerWindow(0, MIN_INTERVAL_MS + 1, false, 1)).toBe(false);
    });

    test('cannot trigger if window already open', () => {
        expect(canTriggerWindow(0, MIN_INTERVAL_MS + 1, true, 3)).toBe(false);
    });

    test('cannot trigger too soon after last window', () => {
        expect(canTriggerWindow(0, MIN_INTERVAL_MS - 1, false, 3)).toBe(false);
    });

    test('can trigger with enough peers after interval', () => {
        expect(canTriggerWindow(0, MIN_INTERVAL_MS + 1, false, 2)).toBe(true);
    });

    test('window duration is 7 minutes', () => {
        expect(WINDOW_DURATION_MS).toBe(420000);
    });
});

describe('Encounter Duration', () => {
    const MIN_ENCOUNTER_DURATION = 2000; // 2 seconds

    const isValidEncounter = (durationMs: number): boolean => {
        return durationMs >= MIN_ENCOUNTER_DURATION;
    };

    test('brief passing is not an encounter', () => {
        expect(isValidEncounter(1500)).toBe(false);
    });

    test('sustained proximity is an encounter', () => {
        expect(isValidEncounter(5000)).toBe(true);
    });

    test('exactly 2 seconds is valid', () => {
        expect(isValidEncounter(2000)).toBe(true);
    });
});

describe('Memory Levels', () => {
    type MemoryLevel = 0 | 1 | 2 | 3;

    const getMemoryLevel = (encounterCount: number): MemoryLevel => {
        if (encounterCount >= 7) return 3; // Resonant
        if (encounterCount >= 4) return 2; // Familiar
        if (encounterCount >= 2) return 1; // Passing
        return 0; // Unknown
    };

    const getMemoryLabel = (level: MemoryLevel): string => {
        switch (level) {
            case 3: return 'Resonant signal';
            case 2: return 'Familiar signal';
            case 1: return 'Passing signal';
            default: return 'Unknown signal';
        }
    };

    test('first encounter is unknown', () => {
        expect(getMemoryLevel(1)).toBe(0);
    });

    test('2-3 encounters is passing', () => {
        expect(getMemoryLevel(2)).toBe(1);
        expect(getMemoryLevel(3)).toBe(1);
    });

    test('4-6 encounters is familiar', () => {
        expect(getMemoryLevel(4)).toBe(2);
        expect(getMemoryLevel(6)).toBe(2);
    });

    test('7+ encounters is resonant', () => {
        expect(getMemoryLevel(7)).toBe(3);
        expect(getMemoryLevel(10)).toBe(3);
    });

    test('memory labels are correct', () => {
        expect(getMemoryLabel(0)).toBe('Unknown signal');
        expect(getMemoryLabel(1)).toBe('Passing signal');
        expect(getMemoryLabel(2)).toBe('Familiar signal');
        expect(getMemoryLabel(3)).toBe('Resonant signal');
    });
});

describe('Temporal Layers', () => {
    type TimeMode = 'live' | 'hour' | 'day' | 'week';

    const getModeInterval = (mode: TimeMode): number => {
        switch (mode) {
            case 'hour': return 60 * 60 * 1000;
            case 'day': return 24 * 60 * 60 * 1000;
            case 'week': return 7 * 24 * 60 * 60 * 1000;
            default: return 0;
        }
    };

    test('live mode has no interval', () => {
        expect(getModeInterval('live')).toBe(0);
    });

    test('hour mode is 1 hour', () => {
        expect(getModeInterval('hour')).toBe(3600000);
    });

    test('day mode is 24 hours', () => {
        expect(getModeInterval('day')).toBe(86400000);
    });

    test('week mode is 7 days', () => {
        expect(getModeInterval('week')).toBe(604800000);
    });
});

describe('Network Zones', () => {
    interface NetworkZone {
        id: string;
        bounds: {
            minLat: number;
            maxLat: number;
            minLng: number;
            maxLng: number;
        };
    }

    const ZONE_AUCKLAND: NetworkZone = {
        id: 'auckland-1010',
        bounds: {
            minLat: -36.870,
            maxLat: -36.830,
            minLng: 174.750,
            maxLng: 174.785,
        },
    };

    const isInsideZone = (lat: number, lng: number, zone: NetworkZone): boolean => {
        return (
            lat >= zone.bounds.minLat &&
            lat <= zone.bounds.maxLat &&
            lng >= zone.bounds.minLng &&
            lng <= zone.bounds.maxLng
        );
    };

    const coordsToNormalized = (lat: number, lng: number, zone: NetworkZone): { x: number; y: number } => {
        const xNorm = (lng - zone.bounds.minLng) / (zone.bounds.maxLng - zone.bounds.minLng);
        const yNorm = (lat - zone.bounds.minLat) / (zone.bounds.maxLat - zone.bounds.minLat);
        return {
            x: xNorm * 2 - 1,
            y: (1 - yNorm) * 2 - 1,
        };
    };

    test('Auckland CBD is in Auckland zone', () => {
        expect(isInsideZone(-36.848, 174.763, ZONE_AUCKLAND)).toBe(true);
    });

    test('Wellington is not in Auckland zone', () => {
        expect(isInsideZone(-41.285, 174.775, ZONE_AUCKLAND)).toBe(false);
    });

    test('center normalizes to origin', () => {
        const centerLat = (ZONE_AUCKLAND.bounds.minLat + ZONE_AUCKLAND.bounds.maxLat) / 2;
        const centerLng = (ZONE_AUCKLAND.bounds.minLng + ZONE_AUCKLAND.bounds.maxLng) / 2;
        const normalized = coordsToNormalized(centerLat, centerLng, ZONE_AUCKLAND);
        expect(normalized.x).toBeCloseTo(0, 5);
        expect(normalized.y).toBeCloseTo(0, 5);
    });

    test('corners normalize to extremes', () => {
        const bottomLeft = coordsToNormalized(
            ZONE_AUCKLAND.bounds.minLat,
            ZONE_AUCKLAND.bounds.minLng,
            ZONE_AUCKLAND
        );
        expect(bottomLeft.x).toBeCloseTo(-1, 5);
        expect(bottomLeft.y).toBeCloseTo(1, 5);

        const topRight = coordsToNormalized(
            ZONE_AUCKLAND.bounds.maxLat,
            ZONE_AUCKLAND.bounds.maxLng,
            ZONE_AUCKLAND
        );
        expect(topRight.x).toBeCloseTo(1, 5);
        expect(topRight.y).toBeCloseTo(-1, 5);
    });
});

describe('Trail Distance Estimation', () => {
    interface Point {
        lat: number;
        lng: number;
    }

    const calculateDistance = (points: Point[]): number => {
        if (points.length < 2) return 0;

        let total = 0;
        for (let i = 1; i < points.length; i++) {
            const dlat = points[i].lat - points[i - 1].lat;
            const dlng = points[i].lng - points[i - 1].lng;
            // Rough meters conversion for Auckland latitude
            const meters = Math.sqrt(dlat * dlat + dlng * dlng) * 111000;
            total += meters;
        }
        return Math.round(total);
    };

    test('single point has no distance', () => {
        expect(calculateDistance([{ lat: -36.848, lng: 174.763 }])).toBe(0);
    });

    test('empty array has no distance', () => {
        expect(calculateDistance([])).toBe(0);
    });

    test('movement accumulates distance', () => {
        const points = [
            { lat: -36.848, lng: 174.763 },
            { lat: -36.849, lng: 174.763 },
            { lat: -36.849, lng: 174.764 },
        ];
        const distance = calculateDistance(points);
        expect(distance).toBeGreaterThan(100);
        expect(distance).toBeLessThan(300);
    });
});

describe('Pattern Walk Validation', () => {
    const MIN_POINTS = 3;
    const MAX_POINTS = 100;
    const MIN_DISTANCE = 50; // meters
    const MAX_DISTANCE = 5000; // meters

    const isValidWalk = (pointCount: number, distance: number): boolean => {
        return (
            pointCount >= MIN_POINTS &&
            pointCount <= MAX_POINTS &&
            distance >= MIN_DISTANCE &&
            distance <= MAX_DISTANCE
        );
    };

    test('too few points is invalid', () => {
        expect(isValidWalk(2, 100)).toBe(false);
    });

    test('too many points is invalid', () => {
        expect(isValidWalk(101, 100)).toBe(false);
    });

    test('too short distance is invalid', () => {
        expect(isValidWalk(10, 30)).toBe(false);
    });

    test('too long distance is invalid', () => {
        expect(isValidWalk(10, 6000)).toBe(false);
    });

    test('valid walk passes', () => {
        expect(isValidWalk(20, 500)).toBe(true);
    });
});
