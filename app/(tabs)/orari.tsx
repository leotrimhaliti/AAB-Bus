import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusDelayResult, BusWithTracking, calculateBusDelay } from '../../hooks/useBusDelay';
import { useBusLocations } from '../../hooks/useBusLocations';
import { useBusStops } from '../../hooks/useBusStops';

const orariData = [
    '08:15', '08:45', '09:15', '09:45', '10:15', '10:45',
    '11:15', '11:45', '12:15', '12:45', '13:15', '13:45',
    '14:15', '14:45', '15:15', '15:45', '16:15', '16:45',
    '17:15', '17:45', '18:15', '18:45'
];

const MINUTES_IN_DAY = 24 * 60;

const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const normalized = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    const newHours = Math.floor(normalized / 60);
    const newMins = normalized % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371000 * c;
};

const formatDelayLabel = (delay?: BusDelayResult): { text: string; variant: 'default' | 'slight' | 'delayed' | 'early' | 'unknown' } => {
    if (!delay || delay.status === 'unknown') {
        return { text: 'Live', variant: 'unknown' };
    }

    if (delay.status === 'delayed') {
        return { text: `+${delay.delayMinutes} min`, variant: 'delayed' };
    }

    if (delay.status === 'slight-delay') {
        return { text: `+${delay.delayMinutes} min`, variant: 'slight' };
    }

    if (delay.status === 'early') {
        return { text: `${delay.delayMinutes} min`, variant: 'early' };
    }

    return { text: 'Në kohë', variant: 'default' };
};

export default function Orari() {
    const insets = useSafeAreaInsets();
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const { busStops, loading, error, refetch } = useBusStops();
    const restUrl = `${process.env.EXPO_PUBLIC_BUS_API_URL || ''}/api/bus`;
    const wsUrl = null;

    const { data: busData } = useBusLocations({
        restUrl,
        wsUrl,
        pollInterval: 10000,
        enableWebSocket: false,
    });

    const orderedStops = useMemo(() => {
        return [...busStops].sort((a, b) => a.stop_order - b.stop_order);
    }, [busStops]);

    const trackedBuses = useMemo(() => {
        if (!busData || orderedStops.length === 0) return [] as BusWithTracking[];

        return Object.values(busData).reduce<BusWithTracking[]>((acc, bus) => {
            if (bus.loc_valid !== '1') {
                return acc;
            }

            const lat = parseFloat(bus.lat);
            const lng = parseFloat(bus.lng);
            if (Number.isNaN(lat) || Number.isNaN(lng)) {
                return acc;
            }

            let closestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;

            orderedStops.forEach((stop, idx) => {
                const distance = haversineDistance(lat, lng, stop.latitude, stop.longitude);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = idx;
                }
            });

            const direction: 'outbound' | 'return' = closestIndex >= orderedStops.length - 1 ? 'return' : 'outbound';

            acc.push({
                ...bus,
                currentStopIndex: closestIndex,
                direction,
            });

            return acc;
        }, []);
    }, [busData, orderedStops]);

    const stopsCount = orderedStops.length;

    const delayByDeparture = useMemo(() => {
        if (!stopsCount) {
            return {} as Record<string, BusDelayResult>;
        }

        return orariData.reduce<Record<string, BusDelayResult>>((acc, time) => {
            acc[time] = calculateBusDelay(time, trackedBuses, stopsCount);
            return acc;
        }, {});
    }, [trackedBuses, stopsCount]);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <Text style={styles.title}>🚌 Orari i Autobusave</Text>
                </View>
                <Text style={styles.loadingText}>Duke ngarkuar stacionet...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <Text style={styles.title}>🚌 Orari i Autobusave</Text>
                </View>
                <Text style={styles.errorText}>Nuk u mund të ngarkohen stacionet e autobusit.</Text>
                <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                    <Text style={styles.retryText}>Provo përsëri</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.title}>🚌 Orari i Autobusave</Text>
                <Text style={styles.subtitle}>Kliko një orë për të parë stacionet</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {orariData.map((ora, index) => {
                    const delayInfo = delayByDeparture[ora];
                    const { text: delayLabel, variant } = formatDelayLabel(delayInfo);
                    const delayMinutes = delayInfo?.delayMinutes ?? 0;
                    const positiveDelay = delayMinutes > 0 ? delayMinutes : 0;

                    return (
                        <View key={index}>
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    selectedTime === ora && styles.itemSelected,
                                ]}
                                onPress={() => setSelectedTime(selectedTime === ora ? null : ora)}
                            >
                                <View style={styles.timeContainer}>
                                    <Text
                                        style={[
                                            styles.ora,
                                            selectedTime === ora && styles.oraSelected,
                                        ]}
                                    >
                                        {ora}
                                    </Text>
                                    <Text style={styles.oraLabel}>Nisje nga AAB</Text>
                                </View>
                                <View style={styles.statusWrapper}>
                                    <Text
                                        style={[
                                            styles.delayBadge,
                                            variant === 'delayed' && styles.delayBadgeDelayed,
                                            variant === 'slight' && styles.delayBadgeSlight,
                                            variant === 'early' && styles.delayBadgeEarly,
                                            variant === 'unknown' && styles.delayBadgeUnknown,
                                        ]}
                                    >
                                        {delayLabel}
                                    </Text>
                                    <Text style={styles.arrow}>{selectedTime === ora ? '▼' : '▶'}</Text>
                                </View>
                            </TouchableOpacity>

                            {selectedTime === ora && (
                                <View style={styles.stopsContainer}>
                                    {(() => {
                                        // Ensure we have the return trip to Kolegji AAB
                                        const displayStops = [...orderedStops];
                                        const lastStop = displayStops[displayStops.length - 1];
                                        const firstStop = displayStops[0];

                                        if (displayStops.length > 0 && lastStop.name !== 'Kolegji AAB' && firstStop.name === 'Kolegji AAB') {
                                            displayStops.push({
                                                ...firstStop,
                                                id: 99999, // Temporary ID
                                                stop_order: 999,
                                                name: 'Kolegji AAB'
                                            });
                                        }

                                        return displayStops.map((stop, stopIndex) => {
                                            let minutesToAdd = stopIndex * 15;

                                            // Special case for return to Kolegji AAB
                                            if (stop.name === 'Kolegji AAB' && stopIndex > 0) {
                                                const lakrishteIndex = displayStops.findIndex(s => s.name === 'Lakrishte');
                                                if (lakrishteIndex !== -1) {
                                                    // User requested +30 min from Lakrishte
                                                    minutesToAdd = (lakrishteIndex * 15) + 30;
                                                }
                                            }

                                            const arrivalTime = addMinutes(ora, minutesToAdd + positiveDelay);

                                            return (
                                                <View key={stopIndex} style={styles.stopItem}>
                                                    <View style={styles.stopIndicator}>
                                                        {stopIndex > 0 && <View style={styles.stopLineUpper} />}
                                                        {stopIndex < displayStops.length - 1 && <View style={styles.stopLineLower} />}
                                                        <View
                                                            style={[
                                                                styles.stopDot,
                                                                stopIndex === 0 && styles.stopDotFirst,
                                                                stopIndex === displayStops.length - 1 && styles.stopDotLast,
                                                            ]}
                                                        />
                                                    </View>
                                                    <View style={styles.stopContent}>
                                                        <Text style={styles.stopName}>{stop.name}</Text>
                                                        <View style={styles.stopTimeContainer}>
                                                            <Text style={styles.stopTime}>{arrivalTime}</Text>
                                                            {positiveDelay > 0 && (
                                                                <Text style={styles.stopDelay}>{`+${positiveDelay}m`}</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginTop: 4,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#c62829',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#c62829',
    },
    retryButton: {
        alignSelf: 'center',
        marginTop: 20,
        backgroundColor: '#c62829',
        padding: 12,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
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
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemSelected: {
        backgroundColor: '#fff',
        borderColor: '#c62829',
        borderWidth: 1,
        shadowColor: '#c62829',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timeContainer: {
        flex: 1,
    },
    statusWrapper: {
        alignItems: 'flex-end',
    },
    ora: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    oraSelected: {
        color: '#c62829',
    },
    oraLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    delayBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2933',
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 4,
    },
    delayBadgeSlight: {
        backgroundColor: 'rgba(255,193,7,0.15)',
        color: '#b7791f',
    },
    delayBadgeDelayed: {
        backgroundColor: 'rgba(198,40,41,0.12)',
        color: '#c62829',
    },
    delayBadgeEarly: {
        backgroundColor: 'rgba(16,185,129,0.12)',
        color: '#059669',
    },
    delayBadgeUnknown: {
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
    },
    arrow: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
        marginTop: 2,
    },
    stopsContainer: {
        backgroundColor: '#fff',
        marginBottom: 16,
        marginHorizontal: 4,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    stopItem: {
        flexDirection: 'row',
        marginBottom: 0,
        minHeight: 44,
    },
    stopIndicator: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    stopDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    stopDotFirst: {
        backgroundColor: '#10b981',
        borderWidth: 0,
    },
    stopDotLast: {
        backgroundColor: '#c62829',
        borderWidth: 0,
    },
    stopLineUpper: {
        position: 'absolute',
        top: 0,
        left: '50%',
        marginLeft: -1,
        width: 2,
        height: '50%',
        backgroundColor: '#e5e7eb',
    },
    stopLineLower: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        marginLeft: -1,
        width: 2,
        height: '50%',
        backgroundColor: '#e5e7eb',
    },
    stopContent: {
        flex: 1,
        paddingBottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
    },
    stopName: {
        fontSize: 14,
        color: '#4b5563',
        fontWeight: '500',
        flex: 1,
    },
    stopTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stopTime: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '600',
    },
    stopDelay: {
        fontSize: 12,
        color: '#c62829',
        fontWeight: '600',
        backgroundColor: 'rgba(198,40,41,0.08)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        marginLeft: 6,
    },
});
