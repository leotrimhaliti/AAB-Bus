import { ROUTE_COORDINATES } from '@/constants/RouteCoordinates';
import { useEffect, useRef, useState } from 'react';

interface SimulatedBusLocation {
    lat: number;
    lng: number;
    heading?: number;
}

export function useSimulatedBus(enabled: boolean = false) {
    const [location, setLocation] = useState<SimulatedBusLocation | null>(null);
    const indexRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLocation(null);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Start from the beginning
        indexRef.current = 0;

        // Move along route every 2 seconds
        intervalRef.current = setInterval(() => {
            const currentPoint = ROUTE_COORDINATES[indexRef.current];
            const nextPoint = ROUTE_COORDINATES[indexRef.current + 1];

            if (currentPoint) {
                // Calculate heading to next point if available
                let heading = undefined;
                if (nextPoint) {
                    const dx = nextPoint.longitude - currentPoint.longitude;
                    const dy = nextPoint.latitude - currentPoint.latitude;
                    heading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
                }

                setLocation({
                    lat: currentPoint.latitude,
                    lng: currentPoint.longitude,
                    heading,
                });

                // Move to next point
                indexRef.current++;

                // Loop back to start when we reach the end
                if (indexRef.current >= ROUTE_COORDINATES.length) {
                    indexRef.current = 0;
                }
            }
        }, 5000); // Move every 5 seconds (more realistic speed)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled]);

    return location;
}
