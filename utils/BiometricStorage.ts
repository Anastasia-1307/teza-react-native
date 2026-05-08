import { gcm } from '@noble/ciphers/aes.js';
import * as SecureStore from 'expo-secure-store';

// Generează chei specifice per utilizator
const getUserBiometricKeys = (username: string) => ({
  enabled: `biometric_enabled_${username}`,
  username: `bio_username_${username}`,
  aesKey: `bio_aes_key_${username}`,
  keychainService: `biometric_${username}`,
  userDisabled: `biometric_user_disabled_${username}` // Flag pentru când utilizatorul dezactivează explicit
});

// Chei globale pentru a ține evidența utilizatorilor cu biometric
const GLOBAL_KEYS = {
  biometricUsers: 'biometric_users_list' // Listă de utilizatori cu biometric activat
};

export class BiometricStorage {
  // Generează cheie AES și o stochează cu protecție biometrică
  static async generateAndSaveBiometricKey(username: string) {
    try {
      const keys = getUserBiometricKeys(username);
      
      // 1. Generează cheie AES de 256 bits
      const aesKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        aesKey[i] = Math.floor(Math.random() * 256);
      }
      const aesKeyHex = Array.from(aesKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // 2. Stochează cheia AES în SecureStore (cu biometric verification la acces)
      await SecureStore.setItemAsync(keys.aesKey, aesKeyHex);
      
      // 3. Marchează biometric ca activat în SecureStore
      await SecureStore.setItemAsync(keys.enabled, 'true');
      await SecureStore.setItemAsync(keys.username, username);
      
      // 4. Adăugăm utilizatorul în lista globală
      await this.addUserToBiometricList(username);

      console.log(`Biometric AES key generated and saved for user: ${username}`);
      return aesKeyHex;
    } catch (error) {
      console.error('Error generating biometric key:', error);
      throw error;
    }
  }
  
  // Criptează parola cu cheia AES biometrică
  static async encryptPasswordWithBiometricKey(username: string, password: string): Promise<string> {
    try {
      const keys = getUserBiometricKeys(username);
      
      // Obține cheia AES din SecureStore (biometric verification se face la nivel de UI)
      const aesKeyHex = await SecureStore.getItemAsync(keys.aesKey);
      
      if (!aesKeyHex) {
        throw new Error('Biometric key not found or authentication failed');
      }
      const aesKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        aesKeyBytes[i] = parseInt(aesKeyHex.substr(i * 2, 2), 16);
      }
      
      // Generează nonce pentru AES-GCM
      const nonce = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        nonce[i] = Math.floor(Math.random() * 256);
      }
      
      // Criptează parola
      const aes = gcm(aesKeyBytes, nonce);
      const passwordBytes = new TextEncoder().encode(password);
      const encrypted = aes.encrypt(passwordBytes);
      
      // Combină nonce + encrypted + tag
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      
      // Convertește în Base64
      const base64 = btoa(String.fromCharCode(...combined));
      
      // Stochează parola criptată
      await SecureStore.setItemAsync(keys.aesKey + '_encrypted', base64);
      
      console.log(`Password encrypted and stored for user: ${username}`);
      return base64;
    } catch (error) {
      console.error('Error encrypting password:', error);
      throw error;
    }
  }
  
  // Decriptează parola cu cheia AES biometrică
  static async decryptPasswordWithBiometricKey(username: string): Promise<string> {
    try {
      const keys = getUserBiometricKeys(username);
      
      // Obține cheia AES din SecureStore
      const aesKeyHex = await SecureStore.getItemAsync(keys.aesKey);
      
      if (!aesKeyHex) {
        throw new Error('Biometric key not found or authentication failed');
      }
      const aesKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        aesKeyBytes[i] = parseInt(aesKeyHex.substr(i * 2, 2), 16);
      }
      
      // Obține parola criptată
      const encryptedBase64 = await SecureStore.getItemAsync(keys.aesKey + '_encrypted');
      if (!encryptedBase64) {
        throw new Error('Encrypted password not found');
      }
      
      // Decodifică din Base64
      const binaryString = atob(encryptedBase64);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }
      
      // Extrage nonce și encrypted data
      const nonce = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Decriptează
      const aes = gcm(aesKeyBytes, nonce);
      const decryptedBytes = aes.decrypt(encrypted);
      
      const password = new TextDecoder().decode(decryptedBytes);
      
      console.log(`Password decrypted for user: ${username}`);
      return password;
    } catch (error) {
      console.error('Error decrypting password:', error);
      throw error;
    }
  }

  // Verifică statusul autentificării biometrice
  static async getBiometricStatus(username?: string) {
    try {
      // Dacă nu avem username, încercăm să găsim primul utilizator cu biometric
      if (!username) {
        const biometricUsers = await this.getBiometricUsersList();
        if (biometricUsers.length > 0) {
          username = biometricUsers[0];
        } else {
          return {
            enabled: false,
            username: ''
          };
        }
      }
      
      const keys = getUserBiometricKeys(username);
      const enabled = await SecureStore.getItemAsync(keys.enabled);
      const storedUsername = await SecureStore.getItemAsync(keys.username);
      
      // Verificare simplificată - doar verificăm flag-ul enabled
      const isEnabled = enabled === 'true';
      
      // Verificare opțională pentru cheie AES
      let hasKeychainKey = false;
      try {
        const aesKeyHex = await SecureStore.getItemAsync(keys.aesKey);
        hasKeychainKey = !!aesKeyHex;
      } catch (error) {
        console.log('Key check failed, but continuing:', error);
        hasKeychainKey = false;
      }

      console.log(`Biometric status for ${username}:`, {
        enabled: isEnabled,
        hasKeychainKey,
        storedUsername
      });

      // Returnăm enabled dacă flag-ul e true, chiar dacă cheia AES lipsește temporar
      return {
        enabled: isEnabled,
        username: storedUsername || username
      };
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return {
        enabled: false,
        username: ''
      };
    }
  }

  // Delete biometric data pentru un utilizator specific
  static async deleteBiometricData(username: string) {
    try {
      const keys = getUserBiometricKeys(username);
      
      // Șterge din SecureStore
      await SecureStore.deleteItemAsync(keys.enabled);
      await SecureStore.deleteItemAsync(keys.username);
      await SecureStore.deleteItemAsync(keys.aesKey);
      await SecureStore.deleteItemAsync(keys.aesKey + '_encrypted');
      
      // Șterge cheia din SecureStore (deja șters mai sus)
      
      // Eliminăm utilizatorul din lista globală
      await this.removeUserFromBiometricList(username);

      // Marchează că utilizatorul a dezactivat explicit biometricul
      await SecureStore.setItemAsync(keys.userDisabled, 'true');

      console.log(`Biometric data deleted for user: ${username}`);
    } catch (error) {
      console.error('Error deleting biometric data:', error);
      throw error;
    }
  }

  // Check if we have biometric data pentru un utilizator specific
  static async hasBiometricData(username?: string) {
    const status = await this.getBiometricStatus(username);
    return status.enabled && !!status.username;
  }
  
  // Metode noi pentru gestionarea listei de utilizatori cu biometric
  
  // Adaugă utilizator în lista globală
  static async addUserToBiometricList(username: string) {
    try {
      const usersList = await this.getBiometricUsersList();
      if (!usersList.includes(username)) {
        usersList.push(username);
        await SecureStore.setItemAsync(GLOBAL_KEYS.biometricUsers, JSON.stringify(usersList));
      }
    } catch (error) {
      console.error('Error adding user to biometric list:', error);
    }
  }
  
  // Elimină utilizator din lista globală
  static async removeUserFromBiometricList(username: string) {
    try {
      const usersList = await this.getBiometricUsersList();
      const updatedList = usersList.filter(user => user !== username);
      await SecureStore.setItemAsync(GLOBAL_KEYS.biometricUsers, JSON.stringify(updatedList));
    } catch (error) {
      console.error('Error removing user from biometric list:', error);
    }
  }
  
  // Obține lista de utilizatori cu biometric activat
  static async getBiometricUsersList(): Promise<string[]> {
    try {
      const usersList = await SecureStore.getItemAsync(GLOBAL_KEYS.biometricUsers);
      return usersList ? JSON.parse(usersList) : [];
    } catch (error) {
      console.error('Error getting biometric users list:', error);
      return [];
    }
  }
  
  // Verifică dacă un utilizator specific are biometric activat
  static async isBiometricEnabledForUser(username: string): Promise<boolean> {
    try {
      const status = await this.getBiometricStatus(username);
      return status.enabled;
    } catch (error) {
      console.error('Error checking biometric status for user:', error);
      return false;
    }
  }

  // Verifică dacă utilizatorul a dezactivat explicit biometricul
  static async hasUserDisabledBiometric(username: string): Promise<boolean> {
    try {
      const keys = getUserBiometricKeys(username);
      const disabled = await SecureStore.getItemAsync(keys.userDisabled);
      return disabled === 'true';
    } catch (error) {
      console.error('Error checking if user disabled biometric:', error);
      return false;
    }
  }

  // Resetează flag-ul de dezactivare când utilizatorul re-activează biometricul
  static async clearUserDisabledFlag(username: string) {
    try {
      const keys = getUserBiometricKeys(username);
      await SecureStore.deleteItemAsync(keys.userDisabled);
    } catch (error) {
      console.error('Error clearing user disabled flag:', error);
    }
  }
  
  // Metodă legacy pentru compatibilitate - redirecționează la noua implementare
  static async saveBiometricData(username: string, password: string) {
    console.warn('Using legacy saveBiometricData - migrating to new AES-based system');
    
    // Generează cheie biometrică
    await this.generateAndSaveBiometricKey(username);
    
    // Criptează parola cu cheia nouă
    await this.encryptPasswordWithBiometricKey(username, password);
  }
  
  // Metodă legacy pentru compatibilitate
  static async getBiometricData(username?: string) {
    console.warn('Using legacy getBiometricData - migrating to new AES-based system');
    
    const status = await this.getBiometricStatus(username);
    
    if (!status.enabled) {
      return {
        enabled: false,
        username: '',
        password: ''
      };
    }
    
    try {
      // Încearcă să decripteze parola
      const password = await this.decryptPasswordWithBiometricKey(status.username);
      
      return {
        enabled: true,
        username: status.username,
        password: password
      };
    } catch (error) {
      console.error('Legacy getBiometricData failed:', error);
      return {
        enabled: false,
        username: '',
        password: ''
      };
    }
  }
}