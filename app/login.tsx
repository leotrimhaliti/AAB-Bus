import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import logo from '@/assets/images/logobus.png';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    // Clear previous errors
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || '');
      return;
    }

    setLoading(true);

    try {
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError(loginError.message || 'Kredencialet janë të gabuara');
      } else {
        router.replace('/'); // navigate to home on success
      }
    } catch (err) {
      setError('Diçka shkoi keq. Ju lutem provoni përsëri.');
      console.log('Login error:', err);
    } finally {
      setLoading(false);
    }
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
            secureTextEntry
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
            onPress={() => {}}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
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
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  loginButton: {
    height: 56,
    minHeight: 56,
    backgroundColor: '#c62829',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    shadowColor: '#c62829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#b91c1c',
  },
  loginButtonText: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forgotPassword: { 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 14, 
    color: '#64748b',
    fontWeight: '600',
  },
  errorText: { 
    color: '#dc2626', 
    fontSize: 14, 
    marginBottom: 8, 
    textAlign: 'left', 
    width: '100%',
    fontWeight: '600',
  },
});
