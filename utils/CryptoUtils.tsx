import { gcm } from '@noble/ciphers/aes.js';

// Aceasta trebuie să fie exact aceeași cheie hex din backend
const AES_KEY_HEX = process.env.EXPO_PUBLIC_AES_KEY_HEX;

if (!AES_KEY_HEX) {
  throw new Error('EXPO_PUBLIC_AES_KEY_HEX environment variable is not set. Please add it to .env.local file.');
}

// Funcție ajutătoare pentru a converti HEX în Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export const CryptoUtils = {
  /**
   * Decriptează o parolă criptată cu AES-GCM în Python (FastAPI)
   */
  decrypt: (encryptedB64: string): string => {
    try {
      // 1. Decodăm din Base64 în Uint8Array (folosind 'atob' nativ din React Native)
      const binaryString = atob(encryptedB64);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }

      // 2. Extragem părțile conform formatului din Python: nonce(12) + tag(16) + ciphertext
      const nonce = combined.slice(0, 12);
      const tag = combined.slice(12, 28);
      const ciphertext = combined.slice(28);

      // 3. Convertim cheia din format HEX în Uint8Array
      const keyBytes = hexToBytes(AES_KEY_HEX);

      // 4. @noble/ciphers așteaptă ciphertext și tag concatenate ÎMPREUNĂ (în această ordine)
      const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
      ciphertextWithTag.set(ciphertext);
      ciphertextWithTag.set(tag, ciphertext.length);

      // 5. Inițializăm AES-GCM
      const aes = gcm(keyBytes, nonce);

      // 6. Decriptăm datele
      const decryptedBytes = aes.decrypt(ciphertextWithTag);

      // 7. Convertim bytes în string (UTF-8)
      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
      console.error('Eroare la decriptare:', error);
      throw new Error('DECRYPTION_FAILED');
    }
  },

  testEncryption: (): boolean => {
    return true;
  }
};