import type { BusStop } from '@/types/busStop';
import { ChevronDown, ChevronRight, Clock, MapPin } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBusStops } from '../../hooks/useBusStops';

// Define the structure for a "Line" (which in this context is a Stop connection)
interface BusLineCard {
    id: number;
    name: string;
    stopId: number;
    color: string;
    stops: BusStop[]; // The remaining stops or context
    departures: string[];
}

// Base departure times from Kolegji AAB
const BASE_DEPARTURES = [
    '08:15', '08:45', '09:15', '09:45', '10:15', '10:45',
    '11:15', '11:45', '12:15', '12:45', '13:15', '13:45',
    '14:15', '14:45', '15:15', '15:45', '16:15', '16:45',
    '17:15', '17:45', '18:15', '18:45'
];

const MINUTES_IN_DAY = 24 * 60;

// Helper to add minutes to "HH:MM"
const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const normalized = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    const newHours = Math.floor(normalized / 60);
    const newMins = normalized % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

// Colors for the 7 stops to keep it visually distinct but cohesive
const STOP_COLORS = [
    '#2563eb', // Blue
    '#0ea5e9', // Sky
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f97316', // Orange
    '#ef4444', // Red
];

export default function Orari() {
    const insets = useSafeAreaInsets();
    const { busStops, loading, error, refetch } = useBusStops();
    const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
    const [currentTimeValues, setCurrentTimeValues] = useState<{ hours: number, minutes: number }>({ hours: 0, minutes: 0 });

    // Update time locally to ensure dynamic checks work when app is open
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTimeValues({
                hours: now.getHours(),
                minutes: now.getMinutes()
            });
        };
        updateTime();
        // Update every minute
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter relevant stops (The 7 main ones)
    const orderedStops = useMemo(() => {
        return [...busStops]
            .filter(s => !s.name.toLowerCase().includes('kthim'))
            .sort((a, b) => a.stop_order - b.stop_order)
            .slice(0, 7);
    }, [busStops]);

    // Construct the "Lines" (which are actually the 7 stops)
    const lineCards: BusLineCard[] = useMemo(() => {
        return orderedStops.map((stop, index) => {
            const offsetMinutes = index * 5;
            const stopDepartures = BASE_DEPARTURES.map(t => addMinutes(t, offsetMinutes));
            const remainingStops = orderedStops.slice(index + 1);
            const displayStops = remainingStops.length > 0 ? remainingStops : [];

            return {
                id: stop.id,
                name: stop.name,
                stopId: stop.id,
                color: STOP_COLORS[index % STOP_COLORS.length],
                stops: displayStops,
                departures: stopDepartures
            };
        });
    }, [orderedStops]);

    // Enhanced logic to find next departure
    const getNextDepartureInfo = (times: string[]) => {
        const { hours, minutes } = currentTimeValues;
        const currentMinutes = hours * 60 + minutes;

        let nextTimeIndex = -1;
        let isTomorrow = false;

        // Find the first time that is >= current time
        for (let i = 0; i < times.length; i++) {
            const [h, m] = times[i].split(':').map(Number);
            const timeMinutes = h * 60 + m;

            if (timeMinutes >= currentMinutes) {
                nextTimeIndex = i;
                break;
            }
        }

        // If no time found today, it's the first time tomorrow
        if (nextTimeIndex === -1) {
            nextTimeIndex = 0;
            isTomorrow = true;
        }

        return {
            time: times[nextTimeIndex],
            isTomorrow,
            label: isTomorrow ? `Nesër ${times[nextTimeIndex]}` : times[nextTimeIndex]
        };
    };

    const toggleCard = (id: number) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    if (loading && lineCards.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>Orari</Text>
                    <Text style={styles.subtitle}>Orët e nisjes për çdo stacion</Text>
                </View>
                <View style={styles.centerContent}>
                    <Text style={styles.loadingText}>Duke ngarkuar të dhënat...</Text>
                </View>
            </View>
        );
    }

    if (error && lineCards.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>Orari</Text>
                </View>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Gabim gjatë ngarkimit.</Text>
                    <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                        <Text style={styles.retryText}>Provo përsëri</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Orari</Text>
                <Text style={styles.subtitle}>Orët e nisjes për çdo stacion</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {lineCards.map((card) => {
                    const isExpanded = expandedCardId === card.id;
                    const { time: nextTime, isTomorrow, label: nextTimeLabel } = getNextDepartureInfo(card.departures);
                    const isLastStop = card.stops.length === 0;

                    return (
                        <View key={card.id} style={styles.card}>
                            <TouchableOpacity
                                style={styles.cardHeader}
                                onPress={() => toggleCard(card.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.headerLeft}>
                                    <View style={[styles.lineDot, { backgroundColor: card.color }]} />
                                    <View>
                                        <Text style={styles.lineName}>{card.name}</Text>
                                        <View style={styles.metaContainer}>
                                            <MapPin size={12} color="#6b7280" />
                                            <Text style={styles.lineMeta}>
                                                {isLastStop ? 'Destinacioni fundor' : `${card.stops.length} stacione në vazhdim`}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.headerRight}>
                                    <Clock size={14} color={isTomorrow ? "#f59e0b" : "#2563eb"} />
                                    <Text style={[styles.nextTime, isTomorrow && { color: '#f59e0b' }]}>
                                        {nextTimeLabel}
                                    </Text>
                                    {isExpanded ? (
                                        <ChevronDown size={20} color="#9ca3af" />
                                    ) : (
                                        <ChevronRight size={20} color="#9ca3af" />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.cardBody}>
                                    {!isLastStop && (
                                        <View style={styles.section}>
                                            <Text style={styles.sectionTitle}>STACIONET E ARDHSHME</Text>
                                            <View style={styles.stationsList}>
                                                {card.stops.map((stop, index) => (
                                                    <View key={stop.id} style={styles.stationBadge}>
                                                        <Text style={styles.stationText}>
                                                            {index + 1}. {stop.name}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>ORËT E NISJES</Text>
                                        <View style={styles.timesGrid}>
                                            {card.departures.map((time, index) => {
                                                const isNext = time === nextTime && !isTomorrow;
                                                return (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.timeBadge,
                                                            isNext && { backgroundColor: card.color, borderColor: card.color }
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.timeText,
                                                                isNext && { color: '#fff', fontWeight: '700' }
                                                            ]}
                                                        >
                                                            {time}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
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
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        backgroundColor: '#f8fafc',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#64748b',
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    lineName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    lineMeta: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nextTime: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stationsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    stationBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    stationText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    timesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timeBadge: {
        width: '23%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        fontVariant: ['tabular-nums'],
    },
});
