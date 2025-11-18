import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '@/constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    variant?: 'light' | 'dark';
}

export const GlassCard = ({
    children,
    style,
    intensity = 20,
    variant = 'dark'
}: GlassCardProps) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView
                intensity={intensity}
                tint={variant}
                style={styles.blur}
            >
                <View style={styles.content}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    blur: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 20,
    },
});
