// Simple mock for react-native-reanimated
const Reanimated = {
  default: {
    call: () => {},
  },
  createAnimatedComponent: (component) => component,
  // Add other commonly used Reanimated exports as needed
  useSharedValue: (value) => ({ value }),
  useAnimatedStyle: (cb) => cb(),
  withTiming: (value) => value,
  withSpring: (value) => value,
};

module.exports = Reanimated;
