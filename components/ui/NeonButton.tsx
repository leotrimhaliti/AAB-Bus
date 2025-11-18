import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/theme';

interface NeonButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

export const NeonButton = ({
    onPress,
    title,
    loading = false,
    variant = 'primary',
    style,
    textStyle,
    disabled = false
}: NeonButtonProps) => {
    const colors = variant === 'primary' ? COLORS.gradients.primary : COLORS.gradients.secondary;
    const shadowStyle = variant === 'primary' ? SHADOWS.neon.cyan : SHADOWS.neon.pink;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.container, style, disabled && styles.disabled]}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={disabled ? ['#475569', '#334155'] : colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, !disabled && shadowStyle]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={[styles.text, textStyle]}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        width: '100%',
    },
    disabled: {
        opacity: 0.7,
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
