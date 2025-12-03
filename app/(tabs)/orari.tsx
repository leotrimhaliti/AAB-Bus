import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function Orari() {
    const insets = useSafeAreaInsets();
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const { busStops, loading, error, refetch } = useBusStops();

    const orderedStops = useMemo(() => {
        return [...busStops].sort((a, b) => a.stop_order - b.stop_order);
    }, [busStops]);

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
                                <Text style={styles.arrow}>{selectedTime === ora ? '▼' : '▶'}</Text>
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

                                            const arrivalTime = addMinutes(ora, minutesToAdd);

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
                                                        <Text style={styles.stopTime}>{arrivalTime}</Text>
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
    arrow: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
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
    stopTime: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '600',
    },
});
