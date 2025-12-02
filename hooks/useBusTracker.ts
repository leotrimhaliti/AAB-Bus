import { useEffect, useRef, useState } from 'react';

export interface Stop {
    id: number;
    name: string;
    lat: number;
    lng: number;
    order: number;
    [key: string]: any;
}

export interface BusLocation {
    lat: number;
    lng: number;
    heading?: number;
}

export interface UseBusTrackerResult {
    snappedLocation: { lat: number; lng: number } | null;
    currentStopIndex: number;
    nextStopIndex: number;
    direction: 'outbound' | 'return';
    progress: number;
    distanceAlongSegment: number;
    isOnRoute: boolean;
}

// Helper: Calculate distance in meters between two points
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export function useBusTracker(
    currentBusLocation: BusLocation | null,
    stops: Stop[]
): UseBusTrackerResult {
    const [trackerState, setTrackerState] = useState<UseBusTrackerResult>({
        snappedLocation: null,
        currentStopIndex: -1,
        nextStopIndex: -1,
        direction: 'outbound',
        progress: 0,
        distanceAlongSegment: 0,
        isOnRoute: false,
    });

    const lastStopIndex = useRef<number>(-1);
    const currentDirection = useRef<'outbound' | 'return'>('outbound');

    useEffect(() => {
        if (!currentBusLocation || !stops || stops.length < 2) {
            return;
        }

        const { lat, lng } = currentBusLocation;

        // Initialize on first run
        if (lastStopIndex.current === -1) {
            lastStopIndex.current = 0;
        }

        let currentStopIdx = lastStopIndex.current;
        let nextStopIdx = -1;
        let direction = currentDirection.current;

        // Determine next stop based on direction
        if (direction === 'outbound') {
            if (currentStopIdx < stops.length - 1) {
                nextStopIdx = currentStopIdx + 1;
            } else {
                // At last stop - switch to return
                direction = 'return';
                currentDirection.current = 'return';
                nextStopIdx = 0; // Return to AAB
            }
        } else {
            // Return: Lakrishte -> AAB
            nextStopIdx = 0;
        }

        // Check if we should advance to the NEXT stop
        // We advance when we're close to next stop AND far from current stop
        if (nextStopIdx !== -1) {
            const currentStop = stops[currentStopIdx];
            const nextStop = stops[nextStopIdx];

            const distToCurrent = getDistance(lat, lng, currentStop.lat, currentStop.lng);
            const distToNext = getDistance(lat, lng, nextStop.lat, nextStop.lng);

            // Only advance if:
            // 1. We're close to next stop (< 100m)
            // 2. We're closer to next than to current (moving forward)
            if (distToNext < 100 && distToNext < distToCurrent) {
                // Advance to next stop
                currentStopIdx = nextStopIdx;
                lastStopIndex.current = currentStopIdx;

                // Update state based on new current stop
                if (direction === 'outbound') {
                    if (currentStopIdx < stops.length - 1) {
                        nextStopIdx = currentStopIdx + 1;
                    } else {
                        // Now at last stop
                        direction = 'return';
                        currentDirection.current = 'return';
                        nextStopIdx = 0;
                    }
                } else {
                    // Returned to AAB - restart outbound
                    if (currentStopIdx === 0) {
                        direction = 'outbound';
                        currentDirection.current = 'outbound';
                        nextStopIdx = 1;
                    }
                }
            }
        }

        // Calculate progress between current and next stop
        let progress = 0;
        let distanceAlongSegment = 0;

        if (nextStopIdx !== -1) {
            const currentStop = stops[currentStopIdx];
            const nextStop = stops[nextStopIdx];
            const totalDist = getDistance(
                currentStop.lat, currentStop.lng,
                nextStop.lat, nextStop.lng
            );
            const distFromCurrent = getDistance(lat, lng, currentStop.lat, currentStop.lng);

            if (totalDist > 0) {
                progress = Math.min(1, distFromCurrent / totalDist);
                distanceAlongSegment = distFromCurrent;
            }
        }

        setTrackerState({
            snappedLocation: { lat, lng },
            currentStopIndex: currentStopIdx,
            nextStopIndex: nextStopIdx,
            direction,
            progress,
            distanceAlongSegment,
            isOnRoute: true,
        });

    }, [currentBusLocation, stops]);

    return trackerState;
}
