// app/(tabs)/orari.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useBusStops } from '../../hooks/useBusStops';

const orariData = [
  '08:15', '08:45', '09:15', '09:45', '10:15', '10:45',
  '11:15', '11:45', '12:15', '12:45', '13:15', '13:45',
  '14:15', '14:45', '15:15', '15:45', '16:15', '16:45',
  '17:15', '17:45', '18:15', '18:45'
];

// Function to add minutes to a time string
const addMinutes = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

export default function Orari() {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { busStops, loading, error, refetch } = useBusStops();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🚌 Orari i Autobusave</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#c62829' }}>Duke ngarkuar stacionet...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🚌 Orari i Autobusave</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#c62829' }}>Nuk u mund të ngarkohen stacionet e autobusit.</Text>
        <TouchableOpacity onPress={refetch} style={{ alignSelf: 'center', marginTop: 20, backgroundColor: '#c62829', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Provo përsëri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚌 Orari i Autobusave</Text>
        <Text style={styles.subtitle}>Kliko një orë për të parë stacionet</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {orariData.map((ora, index) => (
          <View key={index}>
            <TouchableOpacity 
              style={[
                styles.item,
                selectedTime === ora && styles.itemSelected
              ]}
              onPress={() => setSelectedTime(selectedTime === ora ? null : ora)}
            >
              <View style={styles.timeContainer}>
                <Text style={[
                  styles.ora,
                  selectedTime === ora && styles.oraSelected
                ]}>
                  {ora}
                </Text>
                <Text style={styles.oraLabel}>Nisje nga AAB</Text>
              </View>
              <Text style={styles.arrow}>{selectedTime === ora ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {selectedTime === ora && (
              <View style={styles.stopsContainer}>
                {busStops.map((stop, stopIndex) => {
                  const arrivalTime = addMinutes(ora, stopIndex * 15);
                  return (
                    <View key={stopIndex} style={styles.stopItem}>
                      <View style={styles.stopIndicator}>
                        <View style={[
                          styles.stopDot,
                          stopIndex === 0 && styles.stopDotFirst,
                          stopIndex === busStops.length - 1 && styles.stopDotLast
                        ]} />
                        {stopIndex < busStops.length - 1 && (
                          <View style={styles.stopLine} />
                        )}
                      </View>
                      <View style={styles.stopContent}>
                        <Text style={styles.stopName}>{stop.name}</Text>
                        <Text style={styles.stopTime}>{arrivalTime}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: 'rgba(198,40,41,0.95)',
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  item: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderRadius: 18,
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#c62829',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
  },
  itemSelected: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 7,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 7,
  },
  timeContainer: {
    flex: 1,
  },
  ora: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  oraSelected: {
    color: '#c62829',
  },
  oraLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 16,
    color: '#c62829',
    fontWeight: '700',
  },
  stopsContainer: {
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
    marginHorizontal: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    transitionProperty: 'all',
    transitionDuration: '0.2s',
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stopIndicator: {
    width: 30,
    alignItems: 'center',
    position: 'relative',
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ffa726',
  },
  stopDotFirst: {
    backgroundColor: '#4caf50',
    borderWidth: 0,
  },
  stopDotLast: {
    backgroundColor: '#c62829',
    borderWidth: 0,
  },
  stopLine: {
    position: 'absolute',
    top: 12,
    width: 2,
    height: 40,
    backgroundColor: '#ffa726',
  },
  stopContent: {
    flex: 1,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  stopTime: {
    fontSize: 16,
    color: '#c62829',
    fontWeight: '700',
  },
});
