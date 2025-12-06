import LeafletMap from '@/components/LeafletMap';
import { ErrorState } from '@/components/ui/ErrorState';
import { MapSkeleton } from '@/components/ui/Skeleton';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBusLocations } from '../../hooks/useBusLocations';
import { useBusStops } from '../../hooks/useBusStops';


export default function BusTrackingScreen() {
  const insets = useSafeAreaInsets();
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  // Static list view only; no tracking state needed

  const lastMarkerPress = useRef<number>(0);

  // Toast State
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

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
    if (!busStops) return [];
    const sortedStops = [...busStops].sort((a, b) => {
      const aOrder = typeof a.stop_order === 'number' ? a.stop_order : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.stop_order === 'number' ? b.stop_order : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    // Add static return stop
    sortedStops.push({
      id: 'static-return-aab',
      name: 'Kolegji AAB',
      stop_order: 999,
      lat: '0',
      lng: '0'
    } as any);

    return sortedStops;
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

  const isInitialLoading = (loading && !busData) || (busStopsLoading && busStops.length === 0);

  // Prepare bus data for LeafletMap
  const busesForMap = useMemo(() => {
    const realBuses = activeBuses.map(([busId, bus]) => ({
      busId,
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      heading: bus.heading,
    })).filter(b => !isNaN(b.lat) && !isNaN(b.lng));

    return realBuses;
  }, [activeBuses]);

  const handleBusMarkerPress = useCallback((busId: string) => {
    lastMarkerPress.current = Date.now();
    setSelectedBus(busId);
  }, []);

  const handleMapPress = useCallback(() => {
    const timeSinceMarkerPress = Date.now() - lastMarkerPress.current;
    if (timeSinceMarkerPress < 500) {
      return;
    }
    setSelectedBus(null);
  }, []);

  // Get current bus location object
  const currentBusLocation = useMemo(() => {
    if (!selectedBus || !busData) return null;
    const bus = busData[selectedBus];
    if (!bus || bus.loc_valid !== '1') return null;
    return {
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      heading: bus.heading ? parseFloat(bus.heading) : undefined,
    };
  }, [selectedBus, busData]);



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
            <Text style={styles.offlineText}>Offline</Text>
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

      {/* List Section */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedBus ? 'Stacionet e Autobusit' : 'Zgjidhni një autobus'}
          </Text>
        </View>

        {selectedBus ? (
          <ScrollView style={styles.stopsList} showsVerticalScrollIndicator={false}>
            {routeStops.map((stop, index) => {
              const isLastStop = index === routeStops.length - 1;
              const isFirstStop = index === 0;

              return (
                <View key={`${stop.id}-${index}`} style={styles.stopItem}>
                  <View style={styles.stopIndicatorContainer}>
                    {isFirstStop ? (
                      <View style={styles.stopCircleStart} />
                    ) : isLastStop ? (
                      <View style={styles.stopCircleEnd} />
                    ) : (
                      <View style={styles.stopCircle} />
                    )}
                    {index < routeStops.length - 1 && (
                      <View style={styles.stopLine} />
                    )}
                  </View>
                  <View style={styles.stopContent}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Zgjidhni një autobus për të parë stacionet.</Text>
          </View>
        )}
      </View>

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
  // Header has been removed
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
    flex: 2, // Map takes 2/3 of space
    position: 'relative',
    opacity: 1,
  },
  map: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24, // Overlap the map slightly
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
  stopsList: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  stopItem: {
    flexDirection: 'row',
    minHeight: 48, // Reduced height
    alignItems: 'flex-start',
  },
  stopIndicatorContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 16,
    alignSelf: 'stretch',
  },
  stopCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#9ca3af',
    zIndex: 2,
    marginTop: 4, // Visually center with text line-height
  },
  stopCircleStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#d1fae5',
    zIndex: 2,
    marginTop: 3,
  },
  stopCircleEnd: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444', // Cleaner red
    borderWidth: 2,
    borderColor: '#fee2e2',
    zIndex: 2,
    marginTop: 3,
  },
  stopLine: {
    position: 'absolute',
    top: 14, // Start from center of dot
    bottom: -14, // Go to next center
    width: 2,
    backgroundColor: '#e5e7eb',
    left: 15, // Center in 32px container (16 - 1)
    zIndex: 1, // Behind dots
  },
  stopContent: {
    flex: 1,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stopName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
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
