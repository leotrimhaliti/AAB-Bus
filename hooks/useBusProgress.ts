import { useEffect, useRef, useState } from 'react';
import { BusData } from '../types/bus';

interface BusStop {
    name: string;
    latitude?: number;
    longitude?: number;
    lat?: string | number;
    lng?: string | number;
    stop_order?: number | string;
}

/**
 * Helper to get stop coordinates regardless of format (latitude/longitude or lat/lng)
 */
function getStopCoordinates(stop: BusStop): { lat: number; lng: number } | null {
    const lat = stop.latitude ?? (typeof stop.lat === 'string' ? parseFloat(stop.lat) : stop.lat);
    const lng = stop.longitude ?? (typeof stop.lng === 'string' ? parseFloat(stop.lng) : stop.lng);

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        return null;
    }
    return { lat, lng };
}

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)) * 111000;
}

type Phase = 'running' | 'completed_hold';

type BusProgressState = {
    initialized: boolean;
    segIndex: number; // index of segment start stop (between segIndex -> segIndex+1)
    alongM: number; // distance along route in meters
    phase: Phase;
    holdUntilMs: number;
};

type XY = { x: number; y: number };

function toMeters(originLat: number, originLng: number, lat: number, lng: number): XY {
    // Equirectangular approximation; good enough for city-scale distances.
    const latRad = (originLat * Math.PI) / 180;
    const metersPerDegLat = 111_132;
    const metersPerDegLng = 111_320 * Math.cos(latRad);
    return {
        x: (lng - originLng) * metersPerDegLng,
        y: (lat - originLat) * metersPerDegLat,
    };
}

function distanceXY(a: XY, b: XY): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function bearingDeg(from: XY, to: XY): number {
    // Bearing from north, clockwise, in degrees.
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const rad = Math.atan2(dx, dy);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
}

function angleDiffDeg(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

type Projection = {
    segIndex: number;
    t: number; // 0..1 along segment
    crossTrackM: number;
    alongRouteM: number;
    segLenM: number;
};

function projectToSegment(p: XY, a: XY, b: XY): { t: number; proj: XY; crossTrackM: number; segLenM: number } {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;

    const abLen2 = abx * abx + aby * aby;
    const segLenM = Math.sqrt(abLen2);

    if (!isFinite(segLenM) || segLenM < 1e-6) {
        const crossTrackM = distanceXY(p, a);
        return { t: 0, proj: { ...a }, crossTrackM, segLenM: 0 };
    }

    let t = (apx * abx + apy * aby) / abLen2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * abx, y: a.y + t * aby };
    const crossTrackM = distanceXY(p, proj);
    return { t, proj, crossTrackM, segLenM };
}

function segmentIndexFromAlong(prefix: number[], alongM: number): number {
    // prefix length is N stops; segments are 0..N-2
    const lastSegIndex = Math.max(prefix.length - 2, 0);
    const totalLen = prefix[prefix.length - 1] ?? 0;
    const clamped = Math.max(0, Math.min(totalLen, alongM));

    for (let i = 0; i < prefix.length - 1; i++) {
        if (prefix[i + 1] >= clamped) {
            return Math.min(i, lastSegIndex);
        }
    }
    return lastSegIndex;
}

/**
 * Custom hook to track bus progress along a route
 * 
 * The route is one-way: Start -> Stops -> End -> Return to Start
 * Progress only moves FORWARD, never backwards.
 */
export function useBusProgress(
    selectedBus: string | null,
    busData: BusData | null,
    routeStops: BusStop[]
): number {
    const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
    const busStateRef = useRef<{ [key: string]: BusProgressState }>({});

    // If the stop list changes, reset internal tracking to avoid mismatched segment indices.
    useEffect(() => {
        busStateRef.current = {};
        setCurrentStopIndex(0);
    }, [routeStops]);

    useEffect(() => {
        if (!selectedBus || !busData || routeStops.length === 0) {
            setCurrentStopIndex(0);
            return;
        }

        const bus = busData[selectedBus];
        if (!bus || bus.loc_valid !== '1') {
            setCurrentStopIndex(0);
            return;
        }

        const busLat = parseFloat(bus.lat);
        const busLng = parseFloat(bus.lng);
        if (isNaN(busLat) || isNaN(busLng)) {
            setCurrentStopIndex(0);
            return;
        }

        if (routeStops.length < 2) {
            setCurrentStopIndex(0);
            return;
        }

        const stopCoords = routeStops.map(getStopCoordinates);
        if (stopCoords.some((c) => !c)) {
            setCurrentStopIndex(0);
            return;
        }

        const coords = stopCoords as { lat: number; lng: number }[];
        const lastStopIndex = coords.length - 1;
        const first = coords[0];
        const last = coords[lastStopIndex];

        // Tunables (conservative, production-friendly)
        const SNAP_RADIUS_M = 250; // how far from the route we still consider the projection valid
        const LOOKAHEAD_SEGMENTS = 3; // prevents jumping across overlaps
        const BACKSLACK_M = 50; // allow small backwards jitter
        const MAX_ADVANCE_PER_TICK_M = 1000; // prevent huge jumps in a single poll
        const STOP_ARRIVE_RADIUS_M = 140; // consider we are at a stop
        const START_PREFER_RADIUS_M = 180; // if we're very near the first stop, prefer it on init (handles duplicate start/end)
        const COMPLETE_HOLD_MS = 10_000;
        const START_RESET_RADIUS_M = 200;
        const HEADING_TIE_M = 35;

        const nowMs = Date.now();
        const busHeading = (() => {
            const h = bus.heading ? parseFloat(bus.heading) : NaN;
            return Number.isFinite(h) ? ((h % 360) + 360) % 360 : undefined;
        })();

        const p: XY = toMeters(busLat, busLng, busLat, busLng);
        const stopXY = coords.map((c) => toMeters(busLat, busLng, c.lat, c.lng));

        // Build prefix distances and segment lengths
        const prefix: number[] = new Array(stopXY.length).fill(0);
        for (let i = 0; i < stopXY.length - 1; i++) {
            const len = distanceXY(stopXY[i], stopXY[i + 1]);
            prefix[i + 1] = prefix[i] + (Number.isFinite(len) ? len : 0);
        }
        const totalLen = prefix[prefix.length - 1] ?? 0;

        const distToStart = calculateDistance(busLat, busLng, first.lat, first.lng);
        const distToLast = calculateDistance(busLat, busLng, last.lat, last.lng);

        const existing = busStateRef.current[selectedBus];
        const state: BusProgressState = existing ?? {
            initialized: false,
            segIndex: 0,
            alongM: 0,
            phase: 'running',
            holdUntilMs: 0,
        };

        // If the route begins/ends at the same physical point (e.g., duplicated "Kolegji AAB"),
        // naive snapping can incorrectly initialize to the final segment and show the bus at the bottom.
        // On first initialization, strongly prefer the first stop when we're very close to it.
        if (!state.initialized && distToStart <= START_PREFER_RADIUS_M) {
            const isAlsoNearLast = distToLast <= START_PREFER_RADIUS_M;

            if (isAlsoNearLast && busHeading !== undefined && stopXY.length >= 2) {
                const startBear = bearingDeg(stopXY[0], stopXY[1]);
                const endA = stopXY[Math.max(stopXY.length - 2, 0)];
                const endB = stopXY[Math.max(stopXY.length - 1, 1)];
                const endBear = bearingDeg(endA, endB);

                const diffStart = angleDiffDeg(startBear, busHeading);
                const diffEnd = angleDiffDeg(endBear, busHeading);

                // Only choose "end" if heading strongly matches the final segment.
                if (diffEnd + 10 < diffStart) {
                    const next: BusProgressState = {
                        initialized: true,
                        segIndex: Math.max(lastStopIndex - 1, 0),
                        alongM: totalLen,
                        phase: 'running',
                        holdUntilMs: 0,
                    };
                    busStateRef.current[selectedBus] = next;
                    setCurrentStopIndex(lastStopIndex);
                    return;
                }
            }

            const next: BusProgressState = {
                initialized: true,
                segIndex: 0,
                alongM: 0,
                phase: 'running',
                holdUntilMs: 0,
            };
            busStateRef.current[selectedBus] = next;
            setCurrentStopIndex(0);
            return;
        }

        // Completion hold phase: pin to end for 10s, then reset at start.
        if (state.phase === 'completed_hold') {
            setCurrentStopIndex(lastStopIndex);
            if (nowMs < state.holdUntilMs) {
                busStateRef.current[selectedBus] = state;
                return;
            }
            if (distToStart <= START_RESET_RADIUS_M) {
                const next: BusProgressState = {
                    initialized: true,
                    segIndex: 0,
                    alongM: 0,
                    phase: 'running',
                    holdUntilMs: 0,
                };
                busStateRef.current[selectedBus] = next;
                setCurrentStopIndex(0);
                return;
            }
            // If not near start yet, keep pinned at end until it is.
            busStateRef.current[selectedBus] = state;
            return;
        }

        // Helper: choose best projection from a list of segment indices.
        const bestProjection = (segIndices: number[]): Projection | null => {
            let best: Projection | null = null;
            let bestHeadingDiff = Infinity;

            for (const segIndex of segIndices) {
                if (segIndex < 0 || segIndex >= stopXY.length - 1) continue;
                const a = stopXY[segIndex];
                const b = stopXY[segIndex + 1];
                const proj = projectToSegment(p, a, b);

                const alongRouteM = prefix[segIndex] + proj.t * proj.segLenM;
                const candidate: Projection = {
                    segIndex,
                    t: proj.t,
                    crossTrackM: proj.crossTrackM,
                    alongRouteM,
                    segLenM: proj.segLenM,
                };

                if (!best || candidate.crossTrackM < best.crossTrackM) {
                    best = candidate;
                    if (busHeading !== undefined) {
                        const segBear = bearingDeg(a, b);
                        bestHeadingDiff = angleDiffDeg(segBear, busHeading);
                    }
                    continue;
                }

                // Tie-break with heading if both are close.
                if (
                    busHeading !== undefined &&
                    best &&
                    Math.abs(candidate.crossTrackM - best.crossTrackM) <= HEADING_TIE_M
                ) {
                    const segBear = bearingDeg(a, b);
                    const diff = angleDiffDeg(segBear, busHeading);
                    if (diff < bestHeadingDiff) {
                        best = candidate;
                        bestHeadingDiff = diff;
                    }
                }
            }

            return best;
        };

        // Bootstrap: pick the nearest segment across the whole route.
        if (!state.initialized) {
            const allSegs = Array.from({ length: stopXY.length - 1 }, (_, i) => i);
            const boot = bestProjection(allSegs);
            if (!boot || boot.crossTrackM > SNAP_RADIUS_M) {
                // If we can't confidently snap to the route, fall back to start.
                busStateRef.current[selectedBus] = { ...state, initialized: true, segIndex: 0, alongM: 0 };
                setCurrentStopIndex(0);
                return;
            }
            state.initialized = true;
            state.segIndex = boot.segIndex;
            state.alongM = boot.alongRouteM;
        }

        // Once initialized: only consider a small window forward to prevent cross-route jumps.
        const windowStart = Math.max(0, state.segIndex - 1);
        const windowEnd = Math.min(stopXY.length - 2, state.segIndex + LOOKAHEAD_SEGMENTS);
        const windowSegs: number[] = [];
        for (let i = windowStart; i <= windowEnd; i++) windowSegs.push(i);

        const candidate = bestProjection(windowSegs);
        if (!candidate || candidate.crossTrackM > SNAP_RADIUS_M) {
            // Too far from route: keep current stop based on existing state.
            const segIdx = segmentIndexFromAlong(prefix, state.alongM);
            const index = Math.min(segIdx + 1, lastStopIndex);
            setCurrentStopIndex(index);
            busStateRef.current[selectedBus] = state;
            return;
        }

        // Forward-only / jitter clamp
        let newAlongM = candidate.alongRouteM;
        if (newAlongM < state.alongM - BACKSLACK_M) {
            newAlongM = state.alongM;
        }

        // Cap huge forward jumps per tick unless we're extremely close to the route.
        const deltaM = newAlongM - state.alongM;
        if (deltaM > MAX_ADVANCE_PER_TICK_M && candidate.crossTrackM > 30) {
            newAlongM = state.alongM + MAX_ADVANCE_PER_TICK_M;
        }

        // Update segment index from along-distance.
        const newSegIndex = segmentIndexFromAlong(prefix, newAlongM);
        state.segIndex = newSegIndex;
        state.alongM = Math.max(0, Math.min(totalLen, newAlongM));

        // Derive discrete stop index with simple stop-arrival logic.
        const prevStopIndex = state.segIndex;
        const nextStopIndex = Math.min(state.segIndex + 1, lastStopIndex);

        const prev = coords[prevStopIndex];
        const next = coords[nextStopIndex];
        const distPrev = calculateDistance(busLat, busLng, prev.lat, prev.lng);
        const distNext = calculateDistance(busLat, busLng, next.lat, next.lng);

        let derivedIndex = nextStopIndex;
        if (distPrev <= STOP_ARRIVE_RADIUS_M) {
            derivedIndex = prevStopIndex;
        } else if (distNext <= STOP_ARRIVE_RADIUS_M) {
            derivedIndex = nextStopIndex;
        }

        // Mark completion when we reach the final stop.
        if (derivedIndex >= lastStopIndex && distToLast <= STOP_ARRIVE_RADIUS_M) {
            const nextState: BusProgressState = {
                ...state,
                initialized: true,
                segIndex: Math.max(lastStopIndex - 1, 0),
                alongM: totalLen,
                phase: 'completed_hold',
                holdUntilMs: nowMs + COMPLETE_HOLD_MS,
            };
            busStateRef.current[selectedBus] = nextState;
            setCurrentStopIndex(lastStopIndex);
            return;
        }

        busStateRef.current[selectedBus] = state;
        setCurrentStopIndex(derivedIndex);
    }, [selectedBus, busData, routeStops]);

    return currentStopIndex;
}
