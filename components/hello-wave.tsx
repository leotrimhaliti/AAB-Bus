import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
      
export function HelloWave() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [anim]);

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '25deg'],
  });

  return (
    <Animated.Text
      accessibilityRole="text"
      style={{ fontSize: 28, lineHeight: 32, marginTop: -6, transform: [{ rotate }] }}
    >
      👋
    </Animated.Text>
  );
}
