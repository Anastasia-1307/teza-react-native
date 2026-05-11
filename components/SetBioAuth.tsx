import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BiometricStorage } from '../utils/BiometricStorage';
import { Logger } from '../utils/Logger';
import { NetworkConfig } from '../utils/NetworkConfig';

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1c697ff', padding: 20 },
  card: { backgroundColor: '#2ec4b6', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5, width: '100%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  description: { color: '#fff', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  button: { backgroundColor: '#8b5e3c', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#666' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  statusText: { color: '#fff', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});

export default function SetBioAuth() {
  const router = useRouter();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    (async () => {
      await checkBiometricSupport();
      await checkBioAuthStatus();
    })();
  }, []);

  // Verificăm dacă dispozitivul suportă biometric
  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsSupported(false);
    }
  };
  // Verificăm dacă userul curent are biometric activ (local + server)
  const checkBioAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const username = tokenPayload.username || tokenPayload.sub || '';
      setCurrentUsername(username);

      if (username) {
        const bioStatus = await BiometricStorage.getBiometricStatus(username);
        const hasLocalData = bioStatus.enabled;

        // Verificăm și dacă există token persistent pe server
        let hasServerToken = false;
        try {
          const baseUrl = await NetworkConfig.getBaseUrl();
          const response = await fetch(`${baseUrl}/auth/biometric/status/${username}`);
          // Check if response is actually JSON before parsing
          const contentType = response.headers.get('content-type');
          let data;
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            // If not JSON, create a generic error structure
            const text = await response.text();
            data = { biometric_available: false };
            console.error('Non-JSON response from server in SetBioAuth:', text);
          }
          hasServerToken = data.biometric_available === true;
        } catch (serverError) {
          console.error('Error checking server biometric status:', serverError);
        }

        // Biometricul este cu adevărat activ doar dacă există și local, și pe server
        setIsBioEnabled(hasLocalData && hasServerToken);
      }
    } catch (error) {
      console.error('Error checking bio auth status:', error);
    }
  };

  const enableBiometricAuth = async () => {
    if (!isSupported) {
      Alert.alert('Eroare', 'Autentificarea biometrică nu este suportată pe acest dispozitiv.');
      return;
    }
    setIsLoading(true);
    try {
      if (!currentUsername) {
        Alert.alert('Eroare', 'Nu s-a putut obține utilizatorul curent.');
        return;
      }

      // 1. Verificăm dacă avem deja chei locale (AES key etc)
      const hasExistingData = await BiometricStorage.hasBiometricData(currentUsername);
      
      // 2. Cerem autentificarea biometrică pentru confirmare
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifică identitatea pentru a confirma activarea biometriei',
        cancelLabel: 'Anulează',
        fallbackLabel: 'Folosește parola',
      });

      if (!authResult.success) {
        Alert.alert('Eroare', 'Verificarea biometrică a eșuat sau a fost anulată.');
        return;
      }

      // 3. Apelăm serverul pentru a genera token-ul persistent în DB
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${baseUrl}/auth/biometric/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // If not JSON, create a generic error structure
          const text = await response.text();
          errorData = { detail: 'Server error occurred' };
          console.error('Non-JSON response from server in SetBioAuth error handling:', text);
        }
        throw new Error(errorData.detail || 'Failed to setup biometric authentication');
      }
      
      // Check if response is actually JSON before parsing
          const contentType = response.headers.get('content-type');
          let data;
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            // If not JSON, create a generic error structure
            const text = await response.text();
            data = { biometric_available: false };
            console.error('Non-JSON response from server in SetBioAuth:', text);
          }
      
      
      console.log("✅ Biometric setup successful on server. Clearing local session...");
      
      // Ștergem toate datele de sesiune
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
  
      await BiometricStorage.clearUserDisabledFlag(currentUsername);

      // 5. Notificăm userul și îl trimitem la Login
      Alert.alert(
        'Activare reușită',
        'Autentificarea biometrică a fost configurată. Te rugăm să te loghezi din nou cu parola pentru a o activa.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login'); 
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error enabling biometric auth:', error);
      Alert.alert('Eroare', `Nu s-a putut activa biometria: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Dezactivăm biometric pentru userul curent
  const disableBiometricAuth = async () => {
    setIsLoading(true);
    try {
      if (!currentUsername) {
        Alert.alert('Eroare', 'Nu s-a putut identifica utilizatorul curent. Te rugăm să te re-autentifici.');
        return;
      }
      console.log('Requesting biometric authentication...');
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifică identitatea pentru a dezactiva autentificarea biometrică',
        cancelLabel: 'Anulează',
        fallbackLabel: 'Folosește parola',
      });
      if (!authResult.success) {
        Alert.alert('Eroare', 'Verificarea biometrică a eșuat sau a fost anulată.');
        return;
      }
      console.log('Biometric authentication successful');
      console.log('Deleting biometric data for:', currentUsername);
      await BiometricStorage.deleteBiometricData(currentUsername);
      // Notify server to revoke persistent refresh tokens
      await Logger.logUserEvent(currentUsername, 'disable_bio_auth', {
        bio_method: 'aes_key',
        timestamp: new Date().toISOString()
      });
      setIsBioEnabled(false);
      console.log('Biometric authentication disabled successfully');
      Alert.alert('Succes', `Autentificarea biometrică a fost dezactivată pentru ${currentUsername}.`);
    } catch (error: any) {
      console.error('Error disabling biometric auth:', error);
      Alert.alert('Eroare', `Nu s-a putut dezactiva autentificarea biometrică: ${error?.message || 'Eroare necunoscută'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSupported === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2ec4b6" />
        <Text style={styles.statusText}>Se verifică suportul biometric...</Text>
      </View>
    );
  }

  if (!isSupported) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Ionicons name="close-circle" size={60} color="#ff6b6b" style={{ textAlign: 'center', marginBottom: 20 }} />
          <Text style={styles.title}>Autentificare biometrică</Text>
          <Text style={styles.description}>
            Acest dispozitiv nu suportă autentificarea biometrică sau nu ai configurat amprente.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="finger-print" size={60} color="#fff" style={{ textAlign: 'center', marginBottom: 20 }} />
        <Text style={styles.title}>Autentificare biometrică</Text>

        {!isBioEnabled ? (
          <>
            <Text style={styles.description}>
              Activează autentificarea biometrică pentru <Text style={{ fontWeight: 'bold' }}>{currentUsername || 'utilizatorul curent'}</Text> pentru a te autentifica rapid.
            </Text>
            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={enableBiometricAuth} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="finger-print" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Activează autentificarea biometrică</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.description}>
              Autentificarea biometrică este activată pentru <Text style={{ fontWeight: 'bold' }}>{currentUsername}</Text>.
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              <Text style={{ color: '#4CAF50', marginTop: 10, fontWeight: 'bold' }}>Activată pentru {currentUsername}</Text>
            </View>
            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={disableBiometricAuth} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Dezactivează autentificarea biometrică</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}