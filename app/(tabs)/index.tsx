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

  const restUrl = process.env.EXPO_PUBLIC_BUS_API_URL + '/api/buss/locations' || 'https://testapieservice.aab-edu.net/api/buss/locations';
  const wsUrl = null; // WebSocket URL if available

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

  // Fetch bus stops from database
  const { busStops, loading: busStopsLoading, error: busStopsError } = useBusStops();

  // Use busStops from database instead of hardcoded coordinates
  const routeStops = useMemo(() => busStops, [busStops]);

  // Memoize active buses calculation
  const activeBuses = useMemo(() => {
    if (!busData) return [];
    return Object.entries(busData).filter(([_, bus]) => bus.loc_valid === '1');
  }, [busData]);

  // Only show loading on initial load, not on subsequent refreshes
  const isInitialLoading = (loading && !busData) || (busStopsLoading && busStops.length === 0);

  // Debounced center map function
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

  // Memoized marker press handler - now enables following mode
  const handleBusMarkerPress = useCallback((busId: string) => {
    setSelectedBus(busId);
    setIsFollowing(true);
  }, []);

  // Handle map press - deselect bus and stop following
  const handleMapPress = useCallback(() => {
    setSelectedBus(null);
    setIsFollowing(false);
  }, []);

  // Track which direction the bus is going (outbound or return)
  const [busDirection, setBusDirection] = useState<{ [key: string]: 'outbound' | 'return' }>({});

  // Find current stop based on progressive tracking (always moves forward)
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
      const distance = Math.sqrt(
        Math.pow(busLat - stopLat, 2) + Math.pow(busLng - stopLng, 2)
      ) * 111000; // rough approximation in meters
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    let newProgress = currentProgress;
    let newDirection = currentDir;
    
    // Check if we've reached Lakrishte (index 5) - this triggers return journey
    if (closestIndex === 5 && minDistance < 150 && currentDir === 'outbound') {
      newDirection = 'return';
    }
    
    // Special handling for Kolegji AAB (first and last stops are very close)
    const isNearKolegjiAAB = minDistance < 200 && (closestIndex === 0 || closestIndex === routeStops.length - 1);
    
    if (isNearKolegjiAAB) {
      if (currentDir === 'return') {
        // On return journey, should be at Kthim
        newProgress = routeStops.length - 1;
        // Check if we should restart (bus left and came back)
        if (currentProgress === routeStops.length - 1 && minDistance > 300) {
          newProgress = 0;
          newDirection = 'outbound';
        }
      } else {
        // On outbound journey, should be at Nisje
        newProgress = 0;
      }
    }
    // Normal progression logic
    else if (closestIndex > currentProgress && minDistance < 200) {
      newProgress = closestIndex;
    } 
    else if (minDistance < 100 && closestIndex >= currentProgress) {
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

  // Follow selected bus when its position updates
  useEffect(() => {
    if (!isFollowing || !selectedBus || !busData || !mapRef.current) return;

    const bus = busData[selectedBus];
    if (!bus || bus.loc_valid !== '1') return;

    const lat = parseFloat(bus.lat);
    const lng = parseFloat(bus.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    // Animate camera to follow the bus smoothly
    mapRef.current.animateCamera(
      {
        center: {
          latitude: lat,
          longitude: lng,
        },
        zoom: 16, // Closer zoom when following
      },
      { duration: 2000 } // 2 second smooth camera movement
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
        message={
          error && !busData
            ? 'Nuk u mund të ngarkohen të dhënat e autobusëve. Kontrolloni lidhjen me internet dhe provoni përsëri.'
            : 'Nuk u mund të ngarkohen stacionet e autobusit. Kontrolloni lidhjen me internet dhe provoni përsëri.'
        }
        onRetry={refresh}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          testID="bus-tracking-map"
          initialRegion={{
            latitude: 42.638,
            longitude: 21.114,
            latitudeDelta: 0.1,  // Increased to see more area
            longitudeDelta: 0.1,
          }}
          showsUserLocation
          mapType="hybrid"
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

        {/* Following indicator badge */}
        {isFollowing && selectedBus && (
          <View style={styles.followingBadge}>
            <Text style={styles.followingText}>
              📍 Duke ndjekur Autobusin e Selektuar
            </Text>
            <Text style={styles.followingHint}>Kliko hartën për të ndaluar</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.centerButton} 
          onPress={centerMapOnBuses}
          accessible={true}
          accessibilityLabel="Qendro në autobusat"
          accessibilityHint="Qendron hartën në pozicionin e të gjithë autobusave aktiv"
          accessibilityRole="button"
        >
          <Navigation size={20} color="#c62829" />
        </TouchableOpacity>
      </View>

      {selectedBus && (
        <View style={styles.routeInfoContainer}>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>
                ⚠️ Jeni offline
                {isFromCache && lastUpdate && 
                  ` • Të dhënat nga ${new Date(lastUpdate).toLocaleTimeString('sq-AL')}`
                }
              </Text>
            </View>
          )}
          
          <Text style={styles.routeTitle}>Stacionet e Autobusit</Text>
          <ScrollView 
            style={styles.stopsScrollView} 
            showsVerticalScrollIndicator={false}
            testID="stops-scroll-view"
          >
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
                      {isCurrent && ' 🚌'}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.currentStopLabel}>Pozicioni aktual</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c62829',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#c62829',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerModern: {
    backgroundColor: 'rgba(198,40,41,0.95)',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  mapContainer: {
    flex: 2,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
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
  centerButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  stopsScrollView: {
    flex: 1,
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stopIndicatorContainer: {
    width: 30,
    alignItems: 'center',
    position: 'relative',
  },
  stopCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ffa726',
  },
  stopCircleStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
  },
  stopCircleEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#c62829',
  },
  stopCirclePassed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9e9e9e',
    borderWidth: 2,
    borderColor: '#757575',
  },
  stopCircleCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#c62829',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  stopLine: {
    position: 'absolute',
    top: 12,
    width: 2,
    height: 40,
    backgroundColor: '#ffa726',
  },
  stopLinePassed: {
    backgroundColor: '#9e9e9e',
  },
  stopContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stopName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 2,
  },
  stopNamePassed: {
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
  },
  stopNameCurrent: {
    color: '#c62829',
    fontWeight: '700',
    fontSize: 15,
  },
  currentStopLabel: {
    fontSize: 11,
    color: '#c62829',
    fontWeight: '600',
    marginTop: 2,
  },
  offlineBanner: {
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followingBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(198, 40, 41, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  followingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  followingHint: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
});
