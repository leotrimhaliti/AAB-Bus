import { useMemo } from 'react';
import { BusLocation } from '../types/bus';

export interface BusDelayResult {
    delayMinutes: number;
    isDelayed: boolean;
    status: 'on-time' | 'slight-delay' | 'delayed' | 'early' | 'unknown';
    adjustedTime: string;
}

export interface BusWithTracking extends BusLocation {
    currentStopIndex: number;
    direction: 'outbound' | 'return';
}

export function calculateBusDelay(
    scheduledTime: string,
    buses: BusWithTracking[],
    stopsCount: number
): BusDelayResult {
    // Default: no data
    if (!buses || buses.length === 0) {
        return {
            delayMinutes: 0,
            isDelayed: false,
            status: 'unknown',
            adjustedTime: scheduledTime,
        };
    }

    // Parse scheduled time
    const [schedHours, schedMins] = scheduledTime.split(':').map(Number);
    const scheduledMinutes = schedHours * 60 + schedMins;

    // Get current time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Calculate elapsed time since scheduled departure
    let elapsedMinutes = currentMinutes - scheduledMinutes;

    // If scheduled time is in the future, no delay yet
    if (elapsedMinutes < 0) {
        return {
            delayMinutes: 0,
            isDelayed: false,
            status: 'on-time',
            adjustedTime: scheduledTime,
        };
    }

    // If way in the past (>2 hours), probably not active anymore
    if (elapsedMinutes > 120) {
        return {
            delayMinutes: 0,
            isDelayed: false,
            status: 'unknown',
            adjustedTime: scheduledTime,
        };
    }

    // Find the bus that best matches this scheduled departure
    // Strategy: Find bus closest to expected position for this departure time
    const expectedStopIndex = Math.min(
        Math.floor(elapsedMinutes / 15), // Assume 15 min per stop
        stopsCount - 1
    );

    // Find closest matching bus (outbound only for scheduled departures)
    let bestMatch: BusWithTracking | null = null;
    let minDiff = Infinity;

    buses.forEach(bus => {
        if (bus.direction === 'outbound') {
            const diff = Math.abs(bus.currentStopIndex - expectedStopIndex);
            if (diff < minDiff) {
                minDiff = diff;
                bestMatch = bus;
            }
        }
    });

    // If no matching bus found
    if (!bestMatch) {
        return {
            delayMinutes: 0,
            isDelayed: false,
            status: 'unknown',
            adjustedTime: scheduledTime,
        };
    }

    // Calculate delay: difference between actual and expected position
    const stopsDifference = bestMatch.currentStopIndex - expectedStopIndex;
    const delayMinutes = stopsDifference * -15; // Negative = behind schedule = positive delay

    // Calculate adjusted time
    const adjustedMinutes = scheduledMinutes + delayMinutes;
    const adjustedHours = Math.floor(adjustedMinutes / 60) % 24;
    const adjustedMins = adjustedMinutes % 60;
    const adjustedTime = `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMins).padStart(2, '0')}`;

    // Determine status
    let status: 'on-time' | 'slight-delay' | 'delayed' | 'early' | 'unknown';
    if (delayMinutes <= -3) {
        status = 'early';
    } else if (delayMinutes <= 2) {
        status = 'on-time';
    } else if (delayMinutes <= 5) {
        status = 'slight-delay';
    } else {
        status = 'delayed';
    }

    return {
        delayMinutes,
        isDelayed: delayMinutes > 2,
        status,
        adjustedTime,
    };
}

// Calculate delay for a specific scheduled departure time
export function useBusDelay(
    scheduledTime: string,
    buses: BusWithTracking[],
    stopsCount: number
): BusDelayResult {

    return useMemo(
        () => calculateBusDelay(scheduledTime, buses, stopsCount),
        [scheduledTime, buses, stopsCount]
    );
}
