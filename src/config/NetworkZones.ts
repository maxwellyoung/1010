/**
 * Network Zones Configuration
 *
 * Abstracted city bounds for multi-zone support.
 * "The network can expand. New territories await."
 *
 * Each zone represents a geographical area where the network operates.
 * Zones can be adjacent, overlapping, or completely separate.
 */

export interface NetworkZone {
    id: string;
    name: string;
    postcode: string;
    city: string;
    country: string;
    bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
    center: {
        lat: number;
        lng: number;
    };
    mapStyle?: string;
    isActive: boolean;
    launchDate?: string;
}

// Auckland CBD - The original 1010 network
export const ZONE_AUCKLAND_CBD: NetworkZone = {
    id: 'auckland-1010',
    name: '1010',
    postcode: '1010',
    city: 'Auckland',
    country: 'New Zealand',
    bounds: {
        minLat: -36.870,
        maxLat: -36.830,
        minLng: 174.750,
        maxLng: 174.785,
    },
    center: {
        lat: -36.850,
        lng: 174.7675,
    },
    isActive: true,
};

// Future zones (inactive until launch)
export const ZONE_WELLINGTON_CBD: NetworkZone = {
    id: 'wellington-6011',
    name: '6011',
    postcode: '6011',
    city: 'Wellington',
    country: 'New Zealand',
    bounds: {
        minLat: -41.300,
        maxLat: -41.270,
        minLng: 174.760,
        maxLng: 174.790,
    },
    center: {
        lat: -41.285,
        lng: 174.775,
    },
    isActive: false,
};

export const ZONE_MELBOURNE_CBD: NetworkZone = {
    id: 'melbourne-3000',
    name: '3000',
    postcode: '3000',
    city: 'Melbourne',
    country: 'Australia',
    bounds: {
        minLat: -37.830,
        maxLat: -37.800,
        minLng: 144.945,
        maxLng: 144.985,
    },
    center: {
        lat: -37.815,
        lng: 144.965,
    },
    isActive: false,
};

// All registered zones
export const ALL_ZONES: NetworkZone[] = [
    ZONE_AUCKLAND_CBD,
    ZONE_WELLINGTON_CBD,
    ZONE_MELBOURNE_CBD,
];

// Active zones only
export const ACTIVE_ZONES = ALL_ZONES.filter(z => z.isActive);

// Default zone (Auckland CBD)
export const DEFAULT_ZONE = ZONE_AUCKLAND_CBD;

/**
 * Check if a coordinate is inside a zone
 */
export function isInsideZone(lat: number, lng: number, zone: NetworkZone): boolean {
    return (
        lat >= zone.bounds.minLat &&
        lat <= zone.bounds.maxLat &&
        lng >= zone.bounds.minLng &&
        lng <= zone.bounds.maxLng
    );
}

/**
 * Find which zone(s) contain a coordinate
 */
export function findZonesAtLocation(lat: number, lng: number): NetworkZone[] {
    return ACTIVE_ZONES.filter(zone => isInsideZone(lat, lng, zone));
}

/**
 * Get the primary zone for a coordinate (first match)
 */
export function getPrimaryZone(lat: number, lng: number): NetworkZone | null {
    return findZonesAtLocation(lat, lng)[0] ?? null;
}

/**
 * Calculate distance from a point to zone center
 */
export function distanceToZoneCenter(lat: number, lng: number, zone: NetworkZone): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (zone.center.lat - lat) * Math.PI / 180;
    const dLng = (zone.center.lng - lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(zone.center.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Find nearest active zone to a coordinate
 */
export function findNearestZone(lat: number, lng: number): { zone: NetworkZone; distance: number } | null {
    if (ACTIVE_ZONES.length === 0) return null;

    let nearest = ACTIVE_ZONES[0];
    let minDistance = distanceToZoneCenter(lat, lng, nearest);

    for (const zone of ACTIVE_ZONES.slice(1)) {
        const distance = distanceToZoneCenter(lat, lng, zone);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = zone;
        }
    }

    return { zone: nearest, distance: minDistance };
}

/**
 * Convert coordinates to normalized position within a zone (-1 to 1)
 */
export function coordsToNormalized(lat: number, lng: number, zone: NetworkZone): { x: number; y: number } {
    const xNorm = (lng - zone.bounds.minLng) / (zone.bounds.maxLng - zone.bounds.minLng);
    const yNorm = (lat - zone.bounds.minLat) / (zone.bounds.maxLat - zone.bounds.minLat);

    return {
        x: xNorm * 2 - 1,
        y: (1 - yNorm) * 2 - 1, // Flip Y axis
    };
}

/**
 * Convert normalized position to coordinates within a zone
 */
export function normalizedToCoords(x: number, y: number, zone: NetworkZone): { lat: number; lng: number } {
    const xNorm = (x + 1) / 2;
    const yNorm = 1 - (y + 1) / 2; // Flip Y axis back

    return {
        lng: zone.bounds.minLng + xNorm * (zone.bounds.maxLng - zone.bounds.minLng),
        lat: zone.bounds.minLat + yNorm * (zone.bounds.maxLat - zone.bounds.minLat),
    };
}

/**
 * Get zone's bounding box in screen coordinates (for a given size)
 */
export function zoneToBounds(zone: NetworkZone, size: number): {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    return {
        x: 0,
        y: 0,
        width: size,
        height: size,
    };
}
