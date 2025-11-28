import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import logo from '@/assets/images/logobus.png';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    // Animation values
    const logoScale = useRef(new Animated.Value(1.5)).current; // Start big (1.5x)
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            // Phase 1: Logo fades in at big size (0-300ms)
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),

            // Phase 2: Hold for a moment (300-600ms)
            Animated.delay(300),

            // Phase 3: Logo scales down and moves to position (600-1200ms)
            Animated.parallel([
                Animated.timing(logoScale, {
                    toValue: 1, // Scale to exact login page size (180px)
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(logoY, {
                    toValue: -130, // Calculated offset to match login page position (approx 130px up from center)
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            // Immediately finish - no fade animation
            onFinish();
        });
    }, []);

    return (
        <Animated.View style={styles.container}>
            {/* Logo - clean and simple */}
            <Animated.View
                style={{
                    opacity: logoOpacity,
                    transform: [
                        { scale: logoScale },
                        { translateY: logoY },
                    ],
                }}
            >
                <Image source={logo} style={styles.logo} resizeMode="contain" />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    logo: {
        width: 180,
        height: 180,
    },
});
