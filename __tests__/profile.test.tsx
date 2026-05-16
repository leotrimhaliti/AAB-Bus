import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import ProfileScreen from '../app/(tabs)/profile';
import { useAuth } from '../contexts/AuthContext';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('expo-secure-store');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Mock fetch
global.fetch = jest.fn();

describe('ProfileScreen', () => {
  const mockProfile = {
    emri: 'Test',
    mbiemri: 'User',
    adresaf: 'test@example.com',
    fakulteti: 'Engineering',
    group: 'Group A',
    datelindja: '1995-01-01',
    image: 'https://example.com/avatar.jpg',
  };

  const mockSignOut = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      signIn: jest.fn(),
      loading: false,
      profile: { email: 'test@example.com' },
      isAuthenticated: true,
    });

    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(),
      setParams: jest.fn(),
    } as any);

    mockSecureStore.getItemAsync.mockResolvedValue('mock-access-token');
  });

  it('should render profile screen', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Profili im')).toBeTruthy();
    });
  });

  it('should fetch and display profile data from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('Engineering')).toBeTruthy();
    });

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://testapieservice.uniaab.com/api/profile/details',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-access-token',
        }),
      })
    );
  });

  it('should handle API fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Gabim gjatë ngarkimit të të dhënave të profilit.')).toBeTruthy();
    });
  });

  it('should display placeholder when no profile data', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue(null);

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Nuk ka token të aksesit.')).toBeTruthy();
    });
  });

  it('should call signOut and navigate to login on logout', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
    });

    const logoutButton = getByText('Dil nga llogaria');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('should display email from profile if API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Gabim gjatë ngarkimit të të dhënave të profilit.')).toBeTruthy();
    });
  });

  it('should render all info items correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Email Adresa')).toBeTruthy();
      expect(getByText('Datëlindja')).toBeTruthy();
      expect(getByText('Grupi')).toBeTruthy();
      expect(getByText(mockProfile.adresaf)).toBeTruthy();
      expect(getByText(mockProfile.datelindja)).toBeTruthy();
      expect(getByText(mockProfile.group)).toBeTruthy();
    });
  });

  it('should have accessible logout button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    });

    const { getByLabelText } = render(<ProfileScreen />);

    await waitFor(() => {
      const logoutButton = getByLabelText('Dilni nga llogaria');
      expect(logoutButton).toBeTruthy();
    });
  });
});