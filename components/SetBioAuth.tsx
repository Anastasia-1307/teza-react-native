import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BiometricStorage } from '../utils/BiometricStorage';
import { Logger } from '../utils/Logger';

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
  // Verificăm dacă userul curent are biometric activ
  const checkBioAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const username = tokenPayload.username || tokenPayload.sub || '';
      setCurrentUsername(username);

      if (username) {
        const bioStatus = await BiometricStorage.getBiometricStatus(username);
        setIsBioEnabled(bioStatus.enabled);
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
      // Check if biometric data already exists
      const hasExistingData = await BiometricStorage.hasBiometricData(currentUsername);
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifică identitatea pentru a confirma autentificarea biometrică',
        cancelLabel: 'Anulează',
        fallbackLabel: 'Folosește parola',
      });
      if (!authResult.success) {
        Alert.alert('Eroare', 'Verificarea biometrică a eșuat.');
        return;
      }

      if (hasExistingData) {
        // Biometric data is already configured, just confirm it's working
        await Logger.logUserEvent(currentUsername, 'confirm_bio_auth', {
          bio_method: 'aes_key',
          timestamp: new Date().toISOString()
        });
        
        setIsBioEnabled(true);
        Alert.alert('Succes', `Autentificarea biometrică este activată pentru ${currentUsername}.`);
      } else {
        // This shouldn't happen with the new login flow, but handle it gracefully
        Alert.alert(
          'Date biometrice indisponibile',
          'Nu am putut accesa datele biometrice. Pentru a le reconfigura, deconectați-vă și autentificați-vă din nou folosind parola.',
          [
            { text: 'Mai târziu',
              style: 'cancel' },
            {
              text: 'Deloghează-mă',
              onPress: () => {
                router.replace('/login');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      Alert.alert('Eroare', 'Nu s-a putut activa autentificarea biometrică.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dezactivăm biometric pentru userul curent
  const disableBiometricAuth = async () => {
    console.log('Starting disableBiometricAuth...');
    console.log('Current username:', currentUsername);
    console.log('Is bio enabled:', isBioEnabled);
    setIsLoading(true);
    try {
      if (!currentUsername) {
        console.error('No current username found');
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
        console.log('Biometric authentication failed or cancelled');
        Alert.alert('Eroare', 'Verificarea biometrică a eșuat sau a fost anulată.');
        return;
      }
      console.log('Biometric authentication successful');
      console.log('Deleting biometric data for:', currentUsername);
      await BiometricStorage.deleteBiometricData(currentUsername);
      
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