// Mock for react-native-maps
const { View } = require('react-native');

const MapView = View;
MapView.Marker = View;
MapView.Callout = View;
MapView.Polygon = View;
MapView.Polyline = View;
MapView.Circle = View;
MapView.Overlay = View;

module.exports = {
  default: MapView,
  Marker: View,
  Callout: View,
  Polygon: View,
  Polyline: View,
  Circle: View,
  Overlay: View,
  PROVIDER_GOOGLE: 'google',
  PROVIDER_DEFAULT: 'default',
};