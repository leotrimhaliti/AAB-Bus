import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

export const MapSkeleton: React.FC = () => {
  return (
    <View style={styles.mapSkeletonContainer}>
      <View style={styles.mapPlaceholder}>
        <Skeleton width="100%" height="100%" borderRadius={0} />
      </View>
      <View style={styles.controlsSkeleton}>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.profileContainer}>
      {/* Avatar and name */}
      <View style={styles.profileHeader}>
        <Skeleton width={120} height={120} borderRadius={60} style={styles.avatarSkeleton} />
        <Skeleton width={200} height={28} borderRadius={4} style={{ marginTop: 12 }} />
        <Skeleton width={150} height={18} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Details card */}
      <View style={styles.detailsCard}>
        <Skeleton width={180} height={22} borderRadius={4} style={{ marginBottom: 20 }} />
        
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.infoItem}>
            <Skeleton width={20} height={20} borderRadius={4} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
              <Skeleton width={100} height={14} borderRadius={4} />
              <Skeleton width={180} height={16} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const RouteListSkeleton: React.FC = () => {
  return (
    <View style={styles.routeList}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.routeItem}>
          <Skeleton width={12} height={12} borderRadius={6} />
          <Skeleton width="80%" height={14} borderRadius={4} style={{ marginLeft: 15 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  mapSkeletonContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  controlsSkeleton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  avatarSkeleton: {
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  routeList: {
    padding: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});
