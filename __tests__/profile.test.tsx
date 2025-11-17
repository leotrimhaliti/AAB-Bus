import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../app/(tabs)/profile';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';

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
  const mockSession: Session = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2025-01-01',
      app_metadata: {},
      user_metadata: {},
    } as any,
    access_token: 'mock-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer' as const,
  };

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
      session: mockSession,
      signOut: mockSignOut,
      signIn: jest.fn(),
      signUp: jest.fn(),
      loading: false,
      profile: null,
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

  it('should render profile screen', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Detajet Personale')).toBeTruthy();
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
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Error fetching faculty API:',
        expect.any(Error)
      );
    });

    consoleLogSpy.mockRestore();
  });

  it('should display placeholder when no profile data', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue(null);

    const { getAllByText } = render(<ProfileScreen />);

    await waitFor(() => {
      const placeholders = getAllByText('Nuk ka të dhëna');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  it('should call signOut and navigate to login on logout', async () => {
    const { getByText } = render(<ProfileScreen />);

    const logoutButton = getByText('Çkyçu (Log Out)');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('should display email from session if API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const { getByText, findByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText(mockSession.user.email!)).toBeTruthy();
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

  it('should have accessible logout button', () => {
    const { getByLabelText } = render(<ProfileScreen />);
    
    const logoutButton = getByLabelText('Dilni nga llogaria');
    expect(logoutButton).toBeTruthy();
  });
});
