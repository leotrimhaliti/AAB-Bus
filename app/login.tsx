import logo from '@/assets/images/logobus.png';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';
import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password Reset State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contractId, setContractId] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || '');
      return;
    }

    setLoading(true);

    try {
      Sentry.addBreadcrumb({
        message: 'User attempting login',
        category: 'auth',
        level: 'info',
        data: { email }
      });

      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError(loginError.message || 'Kredencialet janë të gabuara');
        Sentry.captureMessage('Login failed', {
          level: 'warning',
          extra: { email, reason: loginError.message }
        });
      } else {
        Sentry.addBreadcrumb({
          message: 'User logged in successfully',
          category: 'auth',
          level: 'info'
        });
        router.replace('/');
      }
    } catch (err) {
      setError('Diçka shkoi keq. Ju lutem provoni përsëri.');
      Sentry.captureException(err, {
        extra: { context: 'login', email }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetError('');

    if (!phoneNumber || !contractId) {
      setResetError('Ju lutem plotësoni të gjitha fushat');
      return;
    }

    setResetLoading(true);

    try {
      // Format the request body as URL-encoded
      const fullPhoneNumber = `383${phoneNumber}`;
      const body = `PhoneNumber=${encodeURIComponent(fullPhoneNumber)}&SmsCode=${encodeURIComponent(contractId)}`;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/Account/ForgotPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const data = await response.json();

      if (response.ok && data.item1 === 1) {
        // Success
        setResetSuccess(true);
        setResetMessage(data.item2 || 'Fjalëkalimi u resetua me sukses!');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetSuccess(false);
          setResetMessage('');
          setPhoneNumber('');
          setContractId('');
        }, 3000);
      } else {
        // API returned an error
        setResetError(data.item2 || 'Diçka shkoi keq. Ju lutem provoni përsëri.');
      }
    } catch {
      setResetError('Lidhja me serverin dështoi. Kontrolloni internetin.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowForgotPassword(false);
    setResetError('');
    setResetSuccess(false);
    setResetMessage('');
    setPhoneNumber('');
    setContractId('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Përdoruesi"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            autoCapitalize="none"
            editable={!loading}
            accessible={true}
            accessibilityLabel="Përdoruesi"
            accessibilityHint="Shkruani username-in tuaj"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Fjalëkalimi"
            placeholderTextColor="#999"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            accessible={true}
            accessibilityLabel="Fjalëkalimi"
            accessibilityHint="Shkruani fjalëkalimin tuaj"
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Kyçu"
            accessibilityHint="Kliko për tu kyçur në aplikacion"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Kyçu</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowForgotPassword(true)}
            accessible={true}
            accessibilityLabel="Keni harruar fjalëkalimin"
            accessibilityRole="button"
          >
            <Text style={styles.forgotPassword}>
              Keni harruar fjalëkalimin?! Klikoni këtu
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={closeResetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Keni harruar fjalëkalimin?!</Text>
              <TouchableOpacity onPress={closeResetModal} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {resetSuccess ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>✓ {resetMessage}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalDescription}>
                  Ju lutem shkruani numrin tuaj të telefonit dhe numrin e kontratës!
                </Text>

                <View style={styles.phoneInputContainer}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+383</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Numri juaj i telefonit"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!resetLoading}
                  />
                </View>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Numri juaj i kontrates"
                  placeholderTextColor="#999"
                  value={contractId}
                  onChangeText={setContractId}
                  editable={!resetLoading}
                  autoCapitalize="characters"
                />

                {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handlePasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.resetButtonText}>Dërgo</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  formContainer: {
    alignItems: 'center'
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 32
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  loginButton: {
    height: 50,
    backgroundColor: '#c62829',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  phonePrefix: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  resetButton: {
    height: 50,
    backgroundColor: '#c62829',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
});
