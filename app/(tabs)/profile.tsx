import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import { supabase } from '@/lib/supabaseClient'; // uncomment if using Supabase

interface InfoItemProps {
    iconName: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    testID?: string;
}

const InfoItem = ({ iconName, label, value, testID }: InfoItemProps) => (
    <View style={infoStyles.itemContainer}>
        <View style={infoStyles.iconCircle}>
            <MaterialCommunityIcons name={iconName} size={20} color="#c62829" />
        </View>
        <View style={infoStyles.textContainer}>
            <Text style={infoStyles.label}>{label}</Text>
            <Text
                style={infoStyles.value}
                testID={testID}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
            >
                {value}
            </Text>
        </View>
    </View>
);

const infoStyles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        flexShrink: 0,
    },
    textContainer: {
        flex: 1,
        flexShrink: 1,
    },
    label: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '600',
    },
});

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { session, signOut } = useAuth();
    const [details, setDetails] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching profile details...');
            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                console.log('No access token found');
                setLoading(false);
                setError('Nuk ka token të aksesit.');
                return;
            }

            console.log('Token found, making request to:', `${process.env.EXPO_PUBLIC_API_URL}/api/profile/details`);

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), 10000);
            });

            const fetchPromise = fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/profile/details`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Race between fetch and timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile data received:', data ? 'Yes' : 'No');
            setDetails(data);
        } catch (err: any) {
            console.error('Profile fetch error:', err);
            setError(err.message === 'Request timed out'
                ? 'Kërkesa vonoi shumë. Ju lutem kontrolloni internetin.'
                : 'Gabim gjatë ngarkimit të të dhënave të profilit.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [session]);
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/login');
    };

    const fullName = `${details.emri || ''} ${details.mbiemri || ''}`.trim();

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <Text style={styles.headerTitle}>Profili im</Text>
                </View>
                <Text style={{ textAlign: 'center', marginTop: 40, color: '#c62829', fontSize: 16, fontWeight: '600' }}>Duke ngarkuar të dhënat e profilit...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <Text style={styles.headerTitle}>Profili im</Text>
                </View>
                <Text style={{ textAlign: 'center', marginTop: 40, color: '#dc2626', fontSize: 16, fontWeight: '600', marginBottom: 20 }}>{error}</Text>
                <TouchableOpacity onPress={fetchDetails} style={{ alignSelf: 'center', marginTop: 8, backgroundColor: '#c62829', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, shadowColor: '#c62829', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>Provo përsëri</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View
            style={styles.container}
            testID="profile-view"
        >
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.headerTitle}>Profili im</Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: details.image || 'https://via.placeholder.com/130' }}
                        style={styles.avatar}
                        testID="profile-image"
                    />
                </View>
                <Text
                    style={styles.name}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                >
                    {fullName}
                </Text>
                <Text style={styles.faculty}>{details.fakulteti}</Text>
            </View>

            <View style={styles.detailsSection}>
                <InfoItem
                    iconName="email-outline"
                    label="Email Adresa"
                    value={details.adresaf || session?.user?.email || 'Nuk ka të dhëna'}
                    testID="profile-email-value"
                />

                <InfoItem
                    iconName="calendar-account-outline"
                    label="Datëlindja"
                    value={details.datelindja || 'Nuk ka të dhëna'}
                    testID="profile-birthdate-value"
                />

                <InfoItem
                    iconName="account-group-outline"
                    label="Grupi"
                    value={details.group || 'Nuk ka të dhëna'}
                    testID="profile-group-value"
                />
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleSignOut}
                accessible={true}
                accessibilityLabel="Dilni nga llogaria"
                accessibilityHint="Kliko për të dalë nga aplikacioni"
                accessibilityRole="button"
            >
                <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Dil nga llogaria</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        paddingBottom: 20, // Add some bottom padding
    },
    contentContainer: {
        paddingBottom: 40,
    },
    header: {
        paddingBottom: 16, // Reduced from 20
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'left',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    profileCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20, // Reduced from 32
        paddingHorizontal: 24,
        marginHorizontal: 20,
        marginTop: 16, // Reduced from 20
        marginBottom: 16, // Reduced from 24
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    faculty: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 12,
        marginTop: 4,
    },
    detailsSection: {
        marginHorizontal: 20,
        marginBottom: 16, // Reduced from 24
        flex: 1, // Allow this section to take available space if needed, or just sit there
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto', // Push to bottom if there is extra space
        backgroundColor: '#c62829',
        paddingVertical: 14,
        minHeight: 50,
        borderRadius: 12,
        marginHorizontal: 20,
        shadowColor: '#c62829',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    avatarContainer: {
        width: 80, // Reduced from 100
        height: 80, // Reduced from 100
        borderRadius: 40,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12, // Reduced from 16
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    avatar: {
        width: 80, // Reduced from 100
        height: 80, // Reduced from 100
        borderRadius: 40,
        resizeMode: 'cover',
    },
    name: {
        fontSize: 18, // Reduced from 20
        fontWeight: '700',
        color: '#1a1a1a',
        marginTop: 4, // Reduced from 8
        marginBottom: 2,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
});
