import LeafletMap from '@/components/LeafletMap';
import { ErrorState } from '@/components/ui/ErrorState';
import { MapSkeleton } from '@/components/ui/Skeleton';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [busProgress, setBusProgress] = useState<{ [key: string]: number }>({});
  const [busDirection, setBusDirection] = useState<{ [key: string]: 'outbound' | 'return' }>({});

  // New state to hold the calculated index for the UI
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);

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
    lastUpdate,
    isOffline,
  } = useBusLocations({
    restUrl,
    wsUrl,
    pollInterval: 10000,
    enableWebSocket: false,
  });

  const { busStops, loading: busStopsLoading, error: busStopsError } = useBusStops();
  const routeStops = useMemo(() => busStops, [busStops]);

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
    return activeBuses.map(([busId, bus]) => ({
      busId,
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      heading: bus.heading,
    })).filter(b => !isNaN(b.lat) && !isNaN(b.lng));
  }, [activeBuses]);

  const handleBusMarkerPress = useCallback((busId: string) => {
    lastMarkerPress.current = Date.now();
    console.log('Bus marker pressed:', busId);

    setSelectedBus(busId);
    setIsFollowing(true);
  }, []);

  const handleMapPress = useCallback(() => {
    const timeSinceMarkerPress = Date.now() - lastMarkerPress.current;
    if (timeSinceMarkerPress < 500) {
      return;
    }
    setSelectedBus(null);
    setIsFollowing(false);
  }, []);

  // --- LOGIC FIX: Moved from useMemo to useEffect to avoid side effects ---
  useEffect(() => {
    if (!selectedBus || !busData || routeStops.length === 0) {
      setCurrentStopIndex(-1);
      return;
    }

    const bus = busData[selectedBus];
    if (!bus || bus.loc_valid !== '1') return;

    const busLat = parseFloat(bus.lat);
    const busLng = parseFloat(bus.lng);
    if (isNaN(busLat) || isNaN(busLng)) return;

    const currentProgress = busProgress[selectedBus] || 0;
    const currentDir = busDirection[selectedBus] || 'outbound';

    let closestIndex = 0;
    let minDistance = Infinity;

    routeStops.forEach((stop, index) => {
      const stopLat = stop.latitude;
      const stopLng = stop.longitude;
      const distance = Math.sqrt(
        Math.pow(busLat - stopLat, 2) + Math.pow(busLng - stopLng, 2)
      ) * 111000; // Approx distance in meters
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    let newProgress = currentProgress;
    let newDirection = currentDir;

    if (closestIndex === 5 && minDistance < 150 && currentDir === 'outbound') {
      newDirection = 'return';
    }

    const isNearKolegjiAAB = minDistance < 200 && (closestIndex === 0 || closestIndex === routeStops.length - 1);

    if (isNearKolegjiAAB) {
      if (currentDir === 'return') {
        newProgress = routeStops.length - 1;
        if (currentProgress === routeStops.length - 1 && minDistance > 300) {
          newProgress = 0;
          newDirection = 'outbound';
        }
      } else {
        newProgress = 0;
      }
    }
    else if (closestIndex > currentProgress && minDistance < 200) {
      newProgress = closestIndex;
    }
    else if (minDistance < 100 && closestIndex >= currentProgress) {
      newProgress = closestIndex;
    }

    // SAFE STATE UPDATES: Only update if value changed to prevent infinite loops
    if (newProgress !== currentProgress) {
      setBusProgress(prev => ({ ...prev, [selectedBus]: newProgress }));
    }
    if (newDirection !== currentDir) {
      setBusDirection(prev => ({ ...prev, [selectedBus]: newDirection }));
    }

    // Update the UI Index
    setCurrentStopIndex(newProgress);

  }, [selectedBus, busData, routeStops, busProgress, busDirection]);




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
      {/* Header - Responsive with safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}> </Text>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
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

        {
          selectedBus ? (
            <ScrollView style={styles.stopsList} showsVerticalScrollIndicator={false}>
              {routeStops.map((stop, index) => {
                const isPassed = currentStopIndex !== -1 && currentStopIndex > index;
                const isCurrent = currentStopIndex !== -1 && currentStopIndex === index;

                return (
                  <View key={index} style={styles.stopItem}>
                    <View style={styles.stopIndicatorContainer}>
                      {isPassed ? (
                        <View style={styles.stopCirclePassed} />
                      ) : isCurrent ? (
                        <View style={styles.stopCircleCurrent} />
                      ) : index === 0 ? (
                        <View style={styles.stopCircleStart} />
                      ) : index === routeStops.length - 1 ? (
                        <View style={styles.stopCircleEnd} />
                      ) : (
                        <View style={styles.stopCircle} />
                      )}
                      {index < routeStops.length - 1 && (
                        <View style={[
                          styles.stopLine,
                          isPassed && styles.stopLinePassed
                        ]} />
                      )}
                    </View>
                    <View style={styles.stopContent}>
                      <Text style={[
                        styles.stopName,
                        isPassed && styles.stopNamePassed,
                        isCurrent && styles.stopNameCurrent
                      ]}>
                        {stop.name}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.currentStopLabel}>Pozicioni aktual</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={require('@/assets/images/aab-buss.png')}
                style={{ width: 60, height: 60, opacity: 0.3, marginBottom: 10 }}
                resizeMode="contain"
              />
              <Text style={styles.emptyStateText}>
                Autobusët aktivë shfaqen në hartë.
              </Text>
            </View>
          )
        }
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
  header: {
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#c62829',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 1,
    fontWeight: '700',
  },
  offlineBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 3,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listContainer: {
    flex: 2,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  listHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9fafb',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  stopsList: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 0,
    minHeight: 50,
  },
  stopIndicatorContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  stopCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    zIndex: 2,
  },
  stopCircleStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    zIndex: 2,
  },
  stopCircleEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c62829',
    zIndex: 2,
  },
  stopCirclePassed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e5e5e5',
    zIndex: 2,
  },
  stopCircleCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#c62829',
    borderWidth: 2,
    borderColor: '#fee2e2',
    zIndex: 2,
    marginLeft: -2,
  },
  stopLine: {
    position: 'absolute',
    top: 10,
    bottom: -10,
    width: 2,
    backgroundColor: '#e5e5e5',
    zIndex: 1,
  },
  stopLinePassed: {
    backgroundColor: '#e5e5e5',
  },
  stopContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stopName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  stopNamePassed: {
    color: '#9ca3af',
  },
  stopNameCurrent: {
    color: '#111827',
    fontWeight: '700',
  },
  currentStopLabel: {
    fontSize: 11,
    color: '#c62829',
    marginTop: 2,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  // Toast Styles
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});