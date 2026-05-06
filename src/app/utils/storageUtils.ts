import CryptoJS from 'crypto-js';

const SECRET_KEY = 'eotoch-secure-storage-key-2026';

/**
 * Secure Storage Utility
 * Encrypts and decrypts data stored in localStorage to ensure user privacy.
 */
export const secureStorage = {
  save: (key: string, data: any) => {
    try {
      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
      localStorage.setItem(key, encryptedData);
    } catch (e) {
      console.error('Error encrypting data:', e);
    }
  },

  load: (key: string) => {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;

      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (e) {
      console.error('Error decrypting data:', e);
      return null;
    }
  },

  remove: (key: string) => {
    localStorage.removeItem(key);
  }
};
