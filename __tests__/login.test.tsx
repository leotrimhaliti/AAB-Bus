import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/login';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      session: null,
      loading: false,
      profile: null,
    });
  });

  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('Përdoruesi')).toBeTruthy();
    expect(getByPlaceholderText('Fjalëkalimi')).toBeTruthy();
    expect(getByText('Kyçu')).toBeTruthy();
  });

  it('should show validation error for empty email', async () => {
    const { getByText } = render(<LoginScreen />);
    const loginButton = getByText('Kyçu');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Ju lutem vendosni përdoruesin')).toBeTruthy();
    });
  });

  it('should show validation error for empty password', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Përdoruesi');
    fireEvent.changeText(emailInput, 'testuser');

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Ju lutem vendosni fjalëkalimin')).toBeTruthy();
    });
  });

  it('should show validation error for password shorter than 6 characters', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Përdoruesi');
    const passwordInput = getByPlaceholderText('Fjalëkalimi');

    fireEvent.changeText(emailInput, 'testuser');
    fireEvent.changeText(passwordInput, '12345');

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Fjalëkalimi duhet të ketë të paktën 6 karaktere')).toBeTruthy();
    });
  });

  it('should call signIn with correct credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Përdoruesi');
    const passwordInput = getByPlaceholderText('Fjalëkalimi');

    fireEvent.changeText(emailInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('should navigate to home on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Përdoruesi');
    const passwordInput = getByPlaceholderText('Fjalëkalimi');

    fireEvent.changeText(emailInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('should show error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ 
      error: { message: 'Email ose fjalëkalimi është i gabuar' } 
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Përdoruesi');
    const passwordInput = getByPlaceholderText('Fjalëkalimi');

    fireEvent.changeText(emailInput, 'wronguser');
    fireEvent.changeText(passwordInput, 'wrongpass123');

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Email ose fjalëkalimi është i gabuar')).toBeTruthy();
    });
  });

  it('should clear errors when user types', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Ju lutem vendosni përdoruesin')).toBeTruthy();
    });

    const emailInput = getByPlaceholderText('Përdoruesi');
    fireEvent.changeText(emailInput, 'test');

    expect(queryByText('Ju lutem vendosni përdoruesin')).toBeNull();
  });

  it('should show loading indicator during login', async () => {
    mockSignIn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    const { getByPlaceholderText, getByText, UNSAFE_getByType } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Përdoruesi');
    const passwordInput = getByPlaceholderText('Fjalëkalimi');

    fireEvent.changeText(emailInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Kyçu');
    fireEvent.press(loginButton);

    // ActivityIndicator should be present during loading
    const { ActivityIndicator } = require('react-native');
    await waitFor(() => {
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });
});
