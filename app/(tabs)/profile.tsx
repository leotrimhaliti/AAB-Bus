import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileDetails {
    emri?: string;
    mbiemri?: string;
    adresaf?: string;
    fakulteti?: string;
    group?: string;
    datelindja?: string;
    image?: string;
}

interface InfoItemProps {
    iconName: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    testID?: string;
}

const InfoItem = ({ iconName, label, value, testID }: InfoItemProps) => (
    <View style={infoStyles.itemContainer}>
        <View style={infoStyles.iconBox}>
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
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginBottom: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    value: {
        fontSize: 15,
        color: '#1f2937',
        fontWeight: '600',
    },
});

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { signOut, profile } = useAuth();
    const [details, setDetails] = useState<ProfileDetails>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                setLoading(false);
                setError('Nuk ka token të aksesit.');
                return;
            }

            const timeoutPromise = new Promise<never>((_, reject) => {
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

            const response = await Promise.race([fetchPromise, timeoutPromise]);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ProfileDetails = await response.json();
            setDetails(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage === 'Request timed out'
                ? 'Kërkesa vonoi shumë. Ju lutem kontrolloni internetin.'
                : 'Gabim gjatë ngarkimit të të dhënave të profilit.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, []);
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/login');
    };

    const fullName = `${details.emri || ''} ${details.mbiemri || ''}`.trim();

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.centerContent}>
                    <Text style={styles.loadingText}>Duke ngarkuar profilin...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchDetails} style={styles.retryButton}>
                        <Text style={styles.retryText}>Provo përsëri</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container} testID="profile-view">
            {/* Top Section - White Rounded */}
            <View style={[styles.topSection, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerBar}>
                    <Text style={styles.headerTitle}>Profili im</Text>
                </View>

                <View style={styles.profileHeader}>
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
            </View>

            {/* Bottom Section - Gray Content */}
            <View style={styles.bottomSection}>
                <View style={styles.infoSection}>
                    <InfoItem
                        iconName="email-outline"
                        label="Email Adresa"
                        value={details.adresaf || profile?.email || 'Nuk ka të dhëna'}
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
                >
                    <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                    <Text style={styles.logoutText}>Dil nga llogaria</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    topSection: {
        flex: 0.45,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 30,
    },
    headerBar: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        letterSpacing: 0.5,
    },
    profileHeader: {
        alignItems: 'center',
        width: '100%',
        flex: 1,
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        padding: 4,
        borderWidth: 3,
        borderColor: '#c62829',
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
        resizeMode: 'cover',
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    faculty: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    bottomSection: {
        flex: 0.55,
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 20,
        justifyContent: 'space-between',
    },
    infoSection: {
        width: '100%',
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#c62829',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#c62829',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        width: '100%',
    },
    logoutText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        color: '#c62829',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#c62829',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
    },
});
