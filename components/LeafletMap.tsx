import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface BusData {
  lat: number;
  lng: number;
  busId: string;
  heading?: string;
}

interface BusStop {
  latitude: number;
  longitude: number;
  name: string;
}

interface LeafletMapProps {
  buses: BusData[];
  stops: BusStop[];
  selectedBus: string | null;
  onBusPress: (busId: string) => void;
  onMapPress: () => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  buses,
  stops,
  selectedBus,
  onBusPress,
  onMapPress,
  initialRegion = { latitude: 42.638, longitude: 21.114, zoom: 13 }
}) => {
  const webViewRef = useRef<WebView>(null);

  const isWebViewReady = useRef(false);

  // Update markers when data changes
  useEffect(() => {
    if (webViewRef.current && isWebViewReady.current) {
      const busesJson = JSON.stringify(buses);
      const stopsJson = JSON.stringify(stops);
      webViewRef.current.injectJavaScript(`
        updateBuses(${busesJson}, "${selectedBus || ''}");
        updateStops(${stopsJson});
        true;
      `);
    }
  }, [buses, stops, selectedBus]);

  // Handle WebView load complete
  const handleLoad = useCallback(() => {
    isWebViewReady.current = true;
    if (webViewRef.current) {
      const busesJson = JSON.stringify(buses);
      const stopsJson = JSON.stringify(stops);
      webViewRef.current.injectJavaScript(`
        updateBuses(${busesJson}, "${selectedBus || ''}");
        updateStops(${stopsJson});
        true;
      `);
    }
  }, [buses, stops, selectedBus]);

  // Center on selected bus
  useEffect(() => {
    if (webViewRef.current && selectedBus) {
      const bus = buses.find(b => b.busId === selectedBus);
      if (bus) {
        webViewRef.current.injectJavaScript(`
          centerOnBus(${bus.lat}, ${bus.lng});
          true;
        `);
      }
    }
  }, [selectedBus, buses]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'busPress') {
        onBusPress(data.busId);
      } else if (data.type === 'mapPress') {
        onMapPress();
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  }, [onBusPress, onMapPress]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .bus-marker {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bus-marker.selected {
      animation: pulse 1.5s infinite;
    }
    .bus-marker img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    .bus-marker .bus-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #c62829;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 11px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    .stop-marker {
      background: #c62829;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .leaflet-control-attribution {
      font-size: 10px;
    }
    .stop-popup .leaflet-popup-content-wrapper {
      background: #c62829;
      color: white;
      border-radius: 8px;
      font-weight: 500;
    }
    .stop-popup .leaflet-popup-content {
      margin: 8px 12px;
      font-size: 13px;
    }
    .stop-popup .leaflet-popup-tip {
      background: #c62829;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], ${initialRegion.zoom});

    // Add OpenStreetMap tiles (FREE!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Store markers
    let busMarkers = {};
    let busPositions = {}; // Store current animated positions
    let animationFrames = {}; // Store animation frame IDs
    let stopMarkers = [];

    // Smooth animation duration in ms
    const ANIMATION_DURATION = 2000;

    // Custom stop marker icon (red pin)
    const stopIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // AAB Bus icon URL - hosted on eservice.aab-edu.net
    const busIconUrl = 'https://eservice.aab-edu.net/assets/images/aab-buss.png';
    
    // Bus icon HTML with AAB logo
    const busIconHtml = (isSelected, count = 1) => \`
      <div class="bus-marker \${isSelected ? 'selected' : ''}">
        <img src="\${busIconUrl}" alt="AAB Bus" style="width: 40px; height: 40px; object-fit: contain;" />
        \${count > 1 ? \`<span class="bus-count">\${count}</span>\` : ''}
      </div>
    \`;

    // Find buses at same/nearby location (within ~20 meters)
    function findOverlappingBuses(buses, targetBus) {
      const threshold = 0.0002; // ~20 meters
      return buses.filter(b => 
        Math.abs(b.lat - targetBus.lat) < threshold && 
        Math.abs(b.lng - targetBus.lng) < threshold
      );
    }

    // Calculate offset for overlapping buses
    function getOffset(index, total) {
      if (total <= 1) return { lat: 0, lng: 0 };
      const angle = (2 * Math.PI * index) / total;
      const radius = 0.00015; // ~15 meters offset
      return {
        lat: Math.cos(angle) * radius,
        lng: Math.sin(angle) * radius
      };
    }

    // Smooth animation function using easing
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Animate marker from current position to target position
    function animateMarker(busId, targetLat, targetLng, marker) {
      // Cancel any existing animation for this bus
      if (animationFrames[busId]) {
        cancelAnimationFrame(animationFrames[busId]);
      }

      // Get current position (or use target if first time)
      const startPos = busPositions[busId] || { lat: targetLat, lng: targetLng };
      
      // If positions are the same, no need to animate
      const distance = Math.sqrt(
        Math.pow(targetLat - startPos.lat, 2) + 
        Math.pow(targetLng - startPos.lng, 2)
      );
      
      // Skip animation for very small movements or first placement
      if (distance < 0.00001) {
        busPositions[busId] = { lat: targetLat, lng: targetLng };
        return;
      }

      // Skip animation for large jumps (> 1km) - likely GPS correction
      if (distance > 0.01) {
        marker.setLatLng([targetLat, targetLng]);
        busPositions[busId] = { lat: targetLat, lng: targetLng };
        return;
      }

      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const easedProgress = easeInOutCubic(progress);

        // Interpolate position
        const currentLat = startPos.lat + (targetLat - startPos.lat) * easedProgress;
        const currentLng = startPos.lng + (targetLng - startPos.lng) * easedProgress;

        // Update marker position
        marker.setLatLng([currentLat, currentLng]);

        // Store current position
        busPositions[busId] = { lat: currentLat, lng: currentLng };

        // Continue animation if not complete
        if (progress < 1) {
          animationFrames[busId] = requestAnimationFrame(animate);
        } else {
          delete animationFrames[busId];
        }
      }

      animationFrames[busId] = requestAnimationFrame(animate);
    }

    // Update buses on map
    function updateBuses(buses, selectedBusId) {
      // Remove old markers that no longer exist
      Object.keys(busMarkers).forEach(id => {
        if (!buses.find(b => b.busId === id)) {
          map.removeLayer(busMarkers[id]);
          delete busMarkers[id];
        }
      });

      // Group buses by approximate location
      const processed = new Set();

      // Add/update markers
      buses.forEach((bus, busIndex) => {
        if (processed.has(bus.busId)) return;
        
        const overlapping = findOverlappingBuses(buses, bus);
        overlapping.forEach(b => processed.add(b.busId));
        
        overlapping.forEach((overlapBus, i) => {
          const offset = getOffset(i, overlapping.length);
          const isSelected = overlapBus.busId === selectedBusId;
          const icon = L.divIcon({
            html: busIconHtml(isSelected),
            className: '',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          const targetLat = overlapBus.lat + offset.lat;
          const targetLng = overlapBus.lng + offset.lng;

          if (busMarkers[overlapBus.busId]) {
            // Update existing marker with smooth animation
            const marker = busMarkers[overlapBus.busId];
            marker.setIcon(icon);
            
            // Animate to new position instead of teleporting
            animateMarker(overlapBus.busId, targetLat, targetLng, marker);
            
            if (overlapBus.heading) {
              marker.setRotationAngle(parseFloat(overlapBus.heading));
            }
          } else {
            // Create new marker (no animation for first appearance)
            const marker = L.marker([targetLat, targetLng], { icon, rotationAngle: overlapBus.heading ? parseFloat(overlapBus.heading) : 0 });
            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'busPress', busId: overlapBus.busId }));
            });
            marker.addTo(map);
            busMarkers[overlapBus.busId] = marker;
            // Store initial position
            busPositions[overlapBus.busId] = { lat: targetLat, lng: targetLng };
          }
        });
      });
    }

    // Update stops on map
    function updateStops(stops) {
      // Remove old stop markers
      stopMarkers.forEach(m => map.removeLayer(m));
      stopMarkers = [];

      // Add new stop markers with proper Leaflet markers and popups
      stops.forEach((stop, index) => {
        const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon });
        
        // Create popup with stop name and number
        const popupContent = '<strong>Stacioni ' + (index + 1) + '</strong><br>' + stop.name;
        marker.bindPopup(popupContent, {
          className: 'stop-popup',
          closeButton: false,
          offset: [0, -20]
        });
        
        // Show popup on hover
        marker.on('mouseover', function() {
          this.openPopup();
        });
        marker.on('mouseout', function() {
          this.closePopup();
        });
        // Keep popup open on click
        marker.on('click', function() {
          this.openPopup();
        });
        
        marker.addTo(map);
        stopMarkers.push(marker);
      });
    }

    // Center map on a bus
    function centerOnBus(lat, lng) {
      map.setView([lat, lng], 16, { animate: true });
    }

    // Handle map click
    map.on('click', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress' }));
    });

    // Fit all buses in view
    function fitAllBuses() {
      const markers = Object.values(busMarkers);
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoad={handleLoad}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default LeafletMap;
