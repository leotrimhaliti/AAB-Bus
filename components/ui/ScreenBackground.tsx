import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export const ScreenBackground = ({ children }: { children: React.ReactNode }) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.gradients.background}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative glowing orbs */}
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />

            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.15,
        filter: 'blur(60px)', // Note: blur filter might need polyfill or different approach on some RN versions, but usually works on modern Expo
    },
    orb1: {
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: COLORS.neon.purple,
        top: -width * 0.2,
        left: -width * 0.2,
    },
    orb2: {
        width: width * 0.7,
        height: width * 0.7,
        backgroundColor: COLORS.neon.cyan,
        bottom: -width * 0.1,
        right: -width * 0.2,
    },
});
