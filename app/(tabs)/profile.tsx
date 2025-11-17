import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
      <Text style={infoStyles.value} testID={testID} numberOfLines={2} ellipsizeMode="tail">{value}</Text>
    </View>
  </View>
);

const infoStyles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#c62829',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    flexWrap: 'wrap',
    letterSpacing: -0.2,
  },
});

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [details, setDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) {
      setLoading(false);
      setError('Nuk ka token të aksesit.');
      return;
    }
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_FACULTY_API_URL || 'https://testapieservice.uniaab.com'}/api/profile/details`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (response.ok) setDetails(data);
      else setError('Nuk u mund të ngarkohen të dhënat e profilit.');
    } catch (err) {
      setError('Gabim gjatë ngarkimit të të dhënave të profilit.');
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profili im</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#c62829', fontSize: 16, fontWeight: '600' }}>Duke ngarkuar të dhënat e profilit...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
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
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      testID="profile-scroll-view"
    >
      <View style={styles.header}>
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
        <Text style={styles.name}>{fullName}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  contentContainer: { 
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(198,40,41,0.98)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  profileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 28,
    marginHorizontal: 20,
    marginBottom: 32,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#c62829',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#c62829',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  faculty: { 
    fontSize: 15, 
    color: '#c62829', 
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 28,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#c62829',
    paddingVertical: 16,
    minHeight: 56,
    borderRadius: 14,
    marginHorizontal: 20,
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#b91c1c',
  },
  logoutText: { 
    color: '#ffffff', 
    fontWeight: '800', 
    fontSize: 18, 
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#c62829',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
