import { BusStop } from '@/types/busStop';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BusTripTimelineProps {
  routeStops: BusStop[];
  currentStopIndex?: number;
  routePosition?: number;
  busId?: string;
  isOffline?: boolean;
}

export const BusTripTimeline: React.FC<BusTripTimelineProps> = ({
  routeStops,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stacionet e Autobusit</Text>
      </View>

      <View style={styles.timelineContainer}>
        {/* Vertical Track Line */}
        <View style={styles.lineTrack} />

        {routeStops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === routeStops.length - 1;

          let label = stop.name;
          if (stop.name.includes('Kolegji AAB')) {
            label = 'Kolegji AAB';
          }

          return (
            <View key={`${stop.id}-${index}`} style={styles.stopRow}>
              <View style={styles.nodeContainer}>
                <View style={[styles.node, isFirst ? styles.nodeFirst : styles.nodeRegular]} />
              </View>

              <View style={[styles.contentContainer, !isLast && styles.contentBorder]}>
                <Text style={styles.stopLabel}>{label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
  },
  timelineContainer: {
    position: 'relative',
    paddingHorizontal: 20,
  },
  lineTrack: {
    position: 'absolute',
    left: 42, // 20 padding + 22 (half of 44 width nodeContainer)
    top: 24, // Start line lower to match first node
    bottom: 24, // End line higher to match last node
    width: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 56, // Fixed height for rows
  },
  nodeContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  nodeFirst: {
    backgroundColor: '#00C48C', // Teal color for the first stop
  },
  nodeRegular: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  contentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
