import { useMemo, useState } from 'react';
import { BusData } from '../types/bus';
import { DISTANCE_THRESHOLDS, ROUTE_STOPS } from '../constants/BusTrackingConstants';

interface BusStop {
    name: string;
    latitude: number;
    longitude: number;
}

type BusDirection = 'outbound' | 'return';

/**
 * Custom hook to track bus progress along a route
 * 
 * Handles complex logic for:
 * - Determining current stop based on GPS coordinates
 * - Managing outbound vs return journey direction
 * - Progressive tracking (bus always moves forward)
 * - Special handling for start/end stops that are geographically close
 * 
 * @param selectedBus - ID of the currently selected bus
 * @param busData - Real-time bus location data
 * @param routeStops - Array of stops along the route
 * @returns Current stop index for the selected bus
 */
export function useBusProgress(
    selectedBus: string | null,
    busData: BusData | null,
    routeStops: BusStop[]
): number {
    const [busProgress, setBusProgress] = useState<{ [key: string]: number }>({});
    const [busDirection, setBusDirection] = useState<{ [key: string]: BusDirection }>({});

    const currentStopIndex = useMemo(() => {
        if (!selectedBus || !busData || routeStops.length === 0) return -1;

        const bus = busData[selectedBus];
        if (!bus || bus.loc_valid !== '1') return -1;

        const busLat = parseFloat(bus.lat);
        const busLng = parseFloat(bus.lng);
        if (isNaN(busLat) || isNaN(busLng)) return -1;

        // Get current progress for this bus, default to 0 (first stop)
        const currentProgress = busProgress[selectedBus] || 0;
        const currentDir = busDirection[selectedBus] || 'outbound';

        // Find the closest stop to the bus
        let closestIndex = 0;
        let minDistance = Infinity;

        routeStops.forEach((stop, index) => {
            const stopLat = stop.latitude;
            const stopLng = stop.longitude;
            const distance =
                Math.sqrt(Math.pow(busLat - stopLat, 2) + Math.pow(busLng - stopLng, 2)) * 111000; // rough approximation in meters
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        let newProgress = currentProgress;
        let newDirection = currentDir;

        // Check if we've reached Lakrishte (index 5) - this triggers return journey
        if (
            closestIndex === ROUTE_STOPS.LAKRISHTE_INDEX &&
            minDistance < DISTANCE_THRESHOLDS.LAKRISHTE_TRIGGER &&
            currentDir === 'outbound'
        ) {
            newDirection = 'return';
        }

        // Special handling for Kolegji AAB (first and last stops are very close)
        const isNearKolegjiAAB =
            minDistance < DISTANCE_THRESHOLDS.KOLEGJI_AAB_PROXIMITY &&
            (closestIndex === 0 || closestIndex === routeStops.length - 1);

        if (isNearKolegjiAAB) {
            if (currentDir === 'return') {
                // On return journey, should be at Kthim
                newProgress = routeStops.length - 1;
                // Check if we should restart (bus left and came back)
                if (
                    currentProgress === routeStops.length - 1 &&
                    minDistance > DISTANCE_THRESHOLDS.RESTART_THRESHOLD
                ) {
                    newProgress = 0;
                    newDirection = 'outbound';
                }
            } else {
                // On outbound journey, should be at Nisje
                newProgress = 0;
            }
        }
        // Normal progression logic
        else if (closestIndex > currentProgress && minDistance < DISTANCE_THRESHOLDS.STOP_PROXIMITY) {
            newProgress = closestIndex;
        } else if (
            minDistance < DISTANCE_THRESHOLDS.STOP_EXACT_MATCH &&
            closestIndex >= currentProgress
        ) {
            newProgress = closestIndex;
        }
        // else: keep current progress

        // Update progress and direction state
        if (newProgress !== currentProgress || newDirection !== currentDir) {
            setBusProgress(prev => ({ ...prev, [selectedBus]: newProgress }));
            setBusDirection(prev => ({ ...prev, [selectedBus]: newDirection }));
        }

        return newProgress;
    }, [selectedBus, busData, routeStops, busProgress, busDirection]);

    return currentStopIndex;
}
