import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';
import { useBusLocations } from '../../hooks/useBusLocations';
import { useBusStops } from '../../hooks/useBusStops';
import { MapSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

// Memoized Bus Marker Component for performance with pulsing animation
const BusMarker = React.memo(({
  busId,
  lat,
  lng,
  heading,
  isSelected,
  onPress
}: {
  busId: string;
  lat: number;
  lng: number;
  heading?: string;
  isSelected: boolean;
  onPress: () => void;
}) => {
  // Calculate rotation based on heading if available
  const rotation = heading ? parseFloat(heading) : 0;

  // Track if image has loaded to prevent flickering - use ref to persist across renders
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pulsing animation for the bus logo
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  // Allow initial render then disable tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setImageLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [busId]); // Re-run when busId changes

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      onPress={onPress}
      zIndex={2}
      testID={`bus-marker-${busId}`}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={rotation}
      tracksViewChanges={!imageLoaded}
    >
      <Animated.View
        style={[
          styles.markerContainer,
          isSelected && styles.markerContainerSelected,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <View style={styles.busLogoWrapper}>
          <Image
            source={require('@/assets/images/aab-buss.png')}
            style={{ width: 40, height: 40, opacity: 1 }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </Marker>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.heading === nextProps.heading &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// Memoized Stop Marker Component
const StopMarker = React.memo(({ stop, index }: { stop: any; index: number }) => (
  <Marker
    key={`stop-${index}`}
    coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
    pinColor="#c62829"
    zIndex={1}
    title={stop.name}
  />
));

export default function BusTrackingScreen() {
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [busProgress, setBusProgress] = useState<{ [key: string]: number }>({});
  const mapRef = useRef<MapView>(null);

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
    isFromCache,
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

  const centerMapOnBuses = useCallback(() => {
    if (!busData || !mapRef.current) return;
    const buses = Object.values(busData).filter(bus => bus.loc_valid === '1');
    if (buses.length === 0) return;

    const coordinates = buses.map(bus => ({
      latitude: parseFloat(bus.lat),
      longitude: parseFloat(bus.lng),
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [busData]);

  const handleBusMarkerPress = useCallback((busId: string) => {
    setSelectedBus(busId);
    setIsFollowing(true);

    // Show toast
    showToast('Duke ndjekur autobusin...');
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedBus(null);
    setIsFollowing(false);
  }, []);

  const [busDirection, setBusDirection] = useState<{ [key: string]: 'outbound' | 'return' }>({});

  const currentStopIndex = useMemo(() => {
    if (!selectedBus || !busData || routeStops.length === 0) return -1;
    const bus = busData[selectedBus];
    if (!bus || bus.loc_valid !== '1') return -1;
    const busLat = parseFloat(bus.lat);
    const busLng = parseFloat(bus.lng);
    if (isNaN(busLat) || isNaN(busLng)) return -1;

    const currentProgress = busProgress[selectedBus] || 0;
    const currentDir = busDirection[selectedBus] || 'outbound';
    let closestIndex = 0;
    let minDistance = Infinity;

    routeStops.forEach((stop, index) => {
      const stopLat = stop.latitude;
      const stopLng = stop.longitude;
      const distance = Math.sqrt(
        Math.pow(busLat - stopLat, 2) + Math.pow(busLng - stopLng, 2)
      ) * 111000;
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

    if (newProgress !== currentProgress || newDirection !== currentDir) {
      setBusProgress(prev => ({ ...prev, [selectedBus]: newProgress }));
      setBusDirection(prev => ({ ...prev, [selectedBus]: newDirection }));
    }

    return newProgress;
  }, [selectedBus, busData, routeStops, busProgress, busDirection]);

  useEffect(() => {
    if (!isFollowing || !selectedBus || !busData || !mapRef.current) return;
    const bus = busData[selectedBus];
    if (!bus || bus.loc_valid !== '1') return;
    const lat = parseFloat(bus.lat);
    const lng = parseFloat(bus.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    mapRef.current.animateCamera(
      { center: { latitude: lat, longitude: lng }, zoom: 16 },
      { duration: 2000 }
    );
  }, [busData, selectedBus, isFollowing]);

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
      {/* Classic Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gjurmimi Live</Text>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* Map Section (Top 60%) */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          testID="bus-tracking-map"
          initialRegion={{
            latitude: 42.638,
            longitude: 21.114,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation
          mapType="standard"
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {activeBuses.map(([busId, bus]) => {
            const lat = parseFloat(bus.lat);
            const lng = parseFloat(bus.lng);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <BusMarker
                key={busId}
                busId={busId}
                lat={lat}
                lng={lng}
                heading={bus.heading}
                isSelected={selectedBus === busId}
                onPress={() => handleBusMarkerPress(busId)}
              />
            );
          })}

          {routeStops.map((stop, index) => (
            <StopMarker key={`stop-${index}`} stop={stop} index={index} />
          ))}
        </MapView>

        <TouchableOpacity
          style={styles.centerButton}
          onPress={centerMapOnBuses}
        >
          <Navigation size={20} color="#c62829" />
        </TouchableOpacity>
      </View>

      {/* List Section (Bottom 40%) */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedBus ? 'Stacionet e Autobusit' : 'Zgjidhni një autobus'}
          </Text>
        </View>

        {selectedBus ? (
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
  header: {
    paddingTop: 50,
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
    fontSize: 20,
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
    flex: 3, // Takes up 60% roughly
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
    flex: 2, // Takes up 40% roughly
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
  // Marker Styles
  markerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  busLogoWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainerSelected: {
    transform: [{ scale: 1.1 }],
  },
});
