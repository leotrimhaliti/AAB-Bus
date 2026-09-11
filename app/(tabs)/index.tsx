import { BusTripTimeline } from '@/components/BusTripTimeline';
import LeafletMap from '@/components/LeafletMap';
import { ErrorState } from '@/components/ui/ErrorState';
import { MapSkeleton } from '@/components/ui/Skeleton';
import { isBusPositionStale } from '@/lib/busFreshness';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBusLocations } from '../../hooks/useBusLocations';
import { useBusProgress } from '../../hooks/useBusProgress';
import { useBusStops } from '../../hooks/useBusStops';

// Helper to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)) * 111000;
}

export default function BusTrackingScreen() {
  const insets = useSafeAreaInsets();
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [timelineBusId, setTimelineBusId] = useState<string | null>(null);
  // Static list view only; no tracking state needed

  const screenHeight = Dimensions.get('window').height;
  const collapsedHeight = Math.round(screenHeight * 0.20) + insets.bottom;
  const expandedHeight = Math.round(screenHeight * 0.35) + insets.bottom;
  const hiddenSheetTranslateY = expandedHeight + 40;

  const lastMarkerPress = useRef<number>(0);

  // Toast State
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Ticks independently of data refresh so a position can age into "stale"
  // even if the bus stops reporting and no new poll response arrives.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const restUrl = process.env.EXPO_PUBLIC_BUS_API_URL!;
  const wsUrl = null;

  const {
    data: busData,
    loading,
    error,
    refresh,
    isOffline,
  } = useBusLocations({
    restUrl,
    wsUrl,
    pollInterval: 10000,
    enableWebSocket: false,
  });

  const { busStops, loading: busStopsLoading, error: busStopsError } = useBusStops();
  const routeStops = useMemo(() => {
    if (!busStops || busStops.length === 0) return [];
    // Sort by stop_order to ensure correct sequence 1..8
    const sorted = [...busStops].sort((a, b) => {
      const aOrder = Number((a as any).stop_order);
      const bOrder = Number((b as any).stop_order);
      const safeA = Number.isFinite(aOrder) ? aOrder : Number.MAX_SAFE_INTEGER;
      const safeB = Number.isFinite(bOrder) ? bOrder : Number.MAX_SAFE_INTEGER;
      return safeA - safeB;
    });

    // Some data sources may only store the AAB stop once (start), even though the route is a loop.
    // If the route starts at AAB but doesn't end near the same point, append a synthetic "Kthim" stop.
    if (sorted.length >= 2) {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const firstIsAab = typeof first.name === 'string' && first.name.includes('Kolegji AAB');

      // consider "same place" within ~30m
      const endIsNearStart = calculateDistance(first.latitude, first.longitude, last.latitude, last.longitude) < 30;
      const endIsAab = typeof last.name === 'string' && last.name.includes('Kolegji AAB');

      if (firstIsAab && !endIsAab && !endIsNearStart) {
        const maxOrder = sorted.reduce((m, s) => Math.max(m, Number(s.stop_order) || 0), 0);
        const minId = sorted.reduce((m, s) => Math.min(m, Number(s.id) || 0), Number.POSITIVE_INFINITY);
        const syntheticId = Number.isFinite(minId) ? (minId - 1) : -1;

        return [
          ...sorted,
          {
            id: syntheticId,
            name: 'Kolegji AAB',
            latitude: first.latitude,
            longitude: first.longitude,
            stop_order: maxOrder + 1,
          },
        ];
      }
    }

    return sorted;
  }, [busStops]);

  const activeBuses = useMemo(() => {
    if (!busData) return [];
    return Object.entries(busData).filter(([_, bus]) => bus.loc_valid === '1');
  }, [busData]);

  const showToast = (message: string) => {
    setToastMsg(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  // Animation for Bottom Sheet
  const slideAnim = useRef(new Animated.Value(hiddenSheetTranslateY)).current;
  const bottomHeightAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const prevTimelineBusIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only animate in when the timeline is first shown.
    if (timelineBusId && !prevTimelineBusIdRef.current) {
      slideAnim.stopAnimation();
      bottomHeightAnim.stopAnimation();
      slideAnim.setValue(hiddenSheetTranslateY); // Start from bottom
      bottomHeightAnim.setValue(collapsedHeight);
      Animated.parallel([
        Animated.timing(bottomHeightAnim, {
          toValue: expandedHeight,
          duration: 260,
          useNativeDriver: false,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
      ]).start();
    }

    // If timeline is not showing, keep the bottom panel collapsed.
    if (!timelineBusId && prevTimelineBusIdRef.current) {
      bottomHeightAnim.stopAnimation();
      bottomHeightAnim.setValue(collapsedHeight);
    }
    prevTimelineBusIdRef.current = timelineBusId;
  }, [timelineBusId, bottomHeightAnim, slideAnim, collapsedHeight, expandedHeight, hiddenSheetTranslateY]);

  const isInitialLoading = (loading && !busData) || (busStopsLoading && busStops.length === 0);

  // Prepare bus data for LeafletMap
  const busesForMap = useMemo(() => {
    const realBuses = activeBuses.map(([busId, bus]) => ({
      busId,
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      heading: bus.heading,
      stale: isBusPositionStale(bus, nowTick),
    })).filter(b => !isNaN(b.lat) && !isNaN(b.lng));

    return realBuses;
  }, [activeBuses, nowTick]);

  const handleBusMarkerPress = useCallback((busId: string) => {
    lastMarkerPress.current = Date.now();
    setSelectedBus(busId);
    setTimelineBusId(busId);
  }, []);

  const handleMapPress = useCallback(() => {
    const timeSinceMarkerPress = Date.now() - lastMarkerPress.current;
    if (timeSinceMarkerPress < 500) {
      return;
    }
    setSelectedBus(null);

    // Animate the timeline out instead of unmounting instantly.
    if (timelineBusId) {
      slideAnim.stopAnimation();
      bottomHeightAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: hiddenSheetTranslateY,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(bottomHeightAnim, {
          toValue: collapsedHeight,
          duration: 260,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished) setTimelineBusId(null);
      });
    } else {
      setTimelineBusId(null);
    }
  }, [bottomHeightAnim, collapsedHeight, hiddenSheetTranslateY, slideAnim, timelineBusId]);

  // Get current bus location object
  const currentBusLocation = useMemo(() => {
    if (!timelineBusId || !busData) return null;
    const bus = busData[timelineBusId];
    if (!bus || bus.loc_valid !== '1') return null;
    return {
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      heading: bus.heading ? parseFloat(bus.heading) : undefined,
    };
  }, [timelineBusId, busData]);

  // A position older than the threshold is shown as "last known" rather
  // than live — see lib/busFreshness.ts.
  const isSelectedBusStale = useMemo(() => {
    if (!timelineBusId || !busData) return false;
    const bus = busData[timelineBusId];
    if (!bus) return false;
    return isBusPositionStale(bus, nowTick);
  }, [timelineBusId, busData, nowTick]);

  // Calculate progress (next stop index)
  const currentStopIndex = useBusProgress(timelineBusId, busData, routeStops);

  // Calculate continuous route position for animation
  const lastRoutePositionRef = useRef<{ [key: string]: number }>({});

  const routePosition = useMemo(() => {
    if (!timelineBusId || !currentBusLocation || routeStops.length < 2) {
      return 0;
    }

    // If we're at the last stop, clamp to end
    if (currentStopIndex >= routeStops.length - 1) {
      lastRoutePositionRef.current[timelineBusId] = routeStops.length - 1;
      return routeStops.length - 1;
    }

    const prevIndex = Math.max(currentStopIndex - 1, 0);
    const prevStop = routeStops[prevIndex];
    const currStop = routeStops[currentStopIndex];

    // Calculate distances
    const dPrev = calculateDistance(
      currentBusLocation.lat, currentBusLocation.lng,
      prevStop.latitude, prevStop.longitude
    );
    const dCurr = calculateDistance(
      currentBusLocation.lat, currentBusLocation.lng,
      currStop.latitude, currStop.longitude
    );
    const dSeg = calculateDistance(
      prevStop.latitude, prevStop.longitude,
      currStop.latitude, currStop.longitude
    );

    // Estimate fraction
    let segmentFraction = 0;
    if (dSeg > 0) {
      // Simple linear interpolation based on distance to next stop
      // As dCurr gets smaller, fraction approaches 1
      segmentFraction = Math.max(0, Math.min(1, 1 - (dCurr / dSeg)));
    }

    // If we are closer to prev stop than current stop, but currentStopIndex says we are at current,
    // it means we just passed the previous stop.
    // However, useBusProgress returns the "next" stop index usually?
    // Wait, useBusProgress returns the "closest stop ahead or current".
    // If currentStopIndex is 3, it means we are approaching stop 3 (from stop 2).
    // So the segment is between 2 and 3.
    // prevIndex = 2, currIndex = 3.

    // But wait, useBusProgress logic:
    // "Find the closest stop that is AHEAD or CURRENT"
    // If we are at stop 2, index is 2.
    // If we leave stop 2 towards 3, index becomes 3 once we are closer to 3?
    // Or does it stay 2 until we reach 3?
    // The logic says: "Advance to the closest stop ahead".
    // So if we are between 2 and 3, and 3 is closest, index is 3.
    // If 2 is closest, index is 2.

    // Let's refine the position logic based on this:
    // If currentStopIndex is i, we are likely between i-1 and i (approaching i) OR between i and i+1 (leaving i).
    // To make it smooth and monotonic, let's assume we are always moving towards currentStopIndex.
    // If currentStopIndex changed from i to i+1, we are now approaching i+1.

    // Let's stick to the plan:
    // prevIndex = max(currentStopIndex - 1, 0)
    // We are moving from prevIndex to currentStopIndex.

    let calculatedPosition = prevIndex + segmentFraction;

    // Monotonic check
    const lastPos = lastRoutePositionRef.current[timelineBusId] || 0;

    // Allow small jitter backwards, but generally prefer forward
    if (calculatedPosition < lastPos - 0.1) {
      calculatedPosition = lastPos;
    }

    // Clamp
    calculatedPosition = Math.min(Math.max(calculatedPosition, 0), routeStops.length - 1);

    // Reset logic: if calculated position is near 0 (start) but last position was near end (7),
    // it means a loop reset happened in useBusProgress.
    // We should allow the position to jump back to 0.
    if (calculatedPosition < 1 && lastPos > routeStops.length - 2) {
      lastRoutePositionRef.current[timelineBusId] = calculatedPosition;
      return calculatedPosition;
    }

    lastRoutePositionRef.current[timelineBusId] = calculatedPosition;
    return calculatedPosition;
  }, [timelineBusId, currentBusLocation, currentStopIndex, routeStops]);

  if (isInitialLoading) {
    return (
      <View style={styles.centerContainer}>
        <MapSkeleton />
      </View>
    );
  }

  if ((error && !busData) || busStopsError) {
    return (
      <ErrorState
        title="Gabim në Ngarkim"
        message={error && !busData ? 'Nuk u mund të ngarkohen të dhënat.' : 'Nuk u mund të ngarkohen stacionet.'}
        onRetry={refresh}
      />
    );
  }



  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        {isOffline && (
          <View style={[styles.offlineBadge, { top: insets.top + 10 }]}>
            <Text style={styles.offlineText}>Jeni offline</Text>
          </View>
        )}
        <LeafletMap
          buses={busesForMap}
          stops={routeStops}
          selectedBus={selectedBus}
          onBusPress={handleBusMarkerPress}
          onMapPress={handleMapPress}
        />
      </View>

      {/* Bottom Timeline Section */}
      <Animated.View style={[styles.bottomContainer, { height: bottomHeightAnim }]}>
        <View style={styles.listContainer} pointerEvents={timelineBusId ? 'none' : 'auto'}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Zgjidhni një autobus</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Zgjidhni një autobus për të parë stacionet.</Text>
          </View>
        </View>

        {timelineBusId ? (
          <Animated.ScrollView
            style={[styles.scrollContainer, styles.sheetOverlay, { transform: [{ translateY: slideAnim }] }]}
          >
            <BusTripTimeline
              routeStops={routeStops}
              currentStopIndex={currentStopIndex}
              routePosition={routePosition}
              busId={timelineBusId}
              isOffline={isOffline}
              isStale={isSelectedBusStale}
            />
          </Animated.ScrollView>
        ) : null}
      </Animated.View>

      {/* Toast Notification */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  offlineBadge: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(198, 40, 41, 0.9)', // Red background for visibility
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 20,
    paddingTop: 8,
  },
  listHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  // Toast Styles
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
