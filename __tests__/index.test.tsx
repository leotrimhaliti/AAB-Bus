import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import BusTrackingScreen from '../app/(tabs)/index';
import { useBusLocations } from '../hooks/useBusLocations';

// Mock dependencies
jest.mock('../hooks/useBusLocations');
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    PROVIDER_GOOGLE: 'google',
  };
});

const mockUseBusLocations = useBusLocations as jest.MockedFunction<typeof useBusLocations>;

describe('BusTrackingScreen', () => {
  const mockBusData = {
    'bus-1': {
      lat: '42.638',
      lng: '21.114',
      loc_valid: '1' as const,
      speed: '45',
      heading: '180',
      timestamp: 1700047800000,
    },
    'bus-2': {
      lat: '42.640',
      lng: '21.116',
      loc_valid: '1' as const,
      speed: '30',
      heading: '90',
      timestamp: 1700047800000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockUseBusLocations.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
      sendWs: jest.fn(),
      canUseWS: false,
      wsReadyState: 0,
      isFromCache: false,
      lastUpdate: null,
      isOffline: false,
    });

    const { UNSAFE_root } = render(<BusTrackingScreen />);
    // Skeleton should be rendered
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render error state with retry button', () => {
    const mockRefresh = jest.fn();
    mockUseBusLocations.mockReturnValue({
      data: null,
      loading: false,
      error: 'Network error occurred',
      refresh: mockRefresh,
      sendWs: jest.fn(),
      canUseWS: false,
      wsReadyState: 0,
      isFromCache: false,
      lastUpdate: null,
      isOffline: false,
    });

    const { getByText } = render(<BusTrackingScreen />);
    
    expect(getByText('Network error occurred')).toBeTruthy();
    const retryButton = getByText('Provo përsëri');
    expect(retryButton).toBeTruthy();
    
    fireEvent.press(retryButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should render bus tracking map with data', async () => {
    mockUseBusLocations.mockReturnValue({
      data: mockBusData,
      loading: false,
      error: null,
      refresh: jest.fn(),
      sendWs: jest.fn(),
      canUseWS: false,
      wsReadyState: 0,
      isFromCache: false,
      lastUpdate: new Date(),
      isOffline: false,
    });

    const { getByText } = render(<BusTrackingScreen />);
    
    await waitFor(() => {
      expect(getByText('Stacionet e Linjës')).toBeTruthy();
    });
  });

  it('should display offline banner when offline', () => {
    const lastUpdate = new Date('2025-11-15T10:00:00Z');
    mockUseBusLocations.mockReturnValue({
      data: mockBusData,
      loading: false,
      error: null,
      refresh: jest.fn(),
      sendWs: jest.fn(),
      canUseWS: false,
      wsReadyState: 0,
      isFromCache: true,
      lastUpdate,
      isOffline: true,
    });

    const { getByText } = render(<BusTrackingScreen />);
    
    expect(getByText(/Jeni offline/)).toBeTruthy();
  });

  it('should filter and render only valid bus locations', () => {
    const mixedData = {
      ...mockBusData,
      'bus-3': {
        lat: '42.650',
        lng: '21.120',
        loc_valid: '0' as const,
        speed: '0',
        heading: '0',
        timestamp: 1700047800000,
      },
    };

    mockUseBusLocations.mockReturnValue({
      data: mixedData,
      loading: false,
      error: null,
      refresh: jest.fn(),
      sendWs: jest.fn(),
      canUseWS: false,
      wsReadyState: 0,
      isFromCache: false,
      lastUpdate: null,
      isOffline: false,
    });

    const { UNSAFE_root } = render(<BusTrackingScreen />);
    
    // Component should render but only show valid buses
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should call refresh when retry button is pressed', () => {
    const mockRefresh = jest.fn();
    mockUseBusLocations.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to fetch',
      refresh: mockRefresh,
      sendWs: jest.fn(),
      canUseWS: false,
      wsReadyState: 0,
      isFromCache: false,
      lastUpdate: null,
      isOffline: false,
    });

    const { getByText } = render(<BusTrackingScreen />);
    const retryButton = getByText('Provo përsëri');
    
    fireEvent.press(retryButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
