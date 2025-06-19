import NodeRSA from 'node-rsa';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export class EncryptionUtils {
  static generateKeyPair() {
    const key = new NodeRSA({ b: 2048 });
    return {
      publicKey: key.exportKey('public'),
      privateKey: key.exportKey('private')
    };
  }

  static encryptWithPublicKey(data, publicKey) {
    const key = new NodeRSA(publicKey);
    return key.encrypt(data, 'base64');
  }

  static decryptWithPrivateKey(encryptedData, privateKey) {
    const key = new NodeRSA(privateKey);
    return key.decrypt(encryptedData, 'utf8');
  }

  static generateAESKey() {
    return uuidv4().replace(/-/g, '');
  }

  static encryptAES(message, key) {
    return CryptoJS.AES.encrypt(message, key).toString();
  }

  static decryptAES(encryptedMessage, key) {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static encryptForMultipleUsers(message, publicKeys) {
    const aesKey = this.generateAESKey();
    const encryptedMessage = this.encryptAES(message, aesKey);
    
    const encryptedKeys = {};
    publicKeys.forEach((publicKey, userId) => {
      encryptedKeys[userId] = this.encryptWithPublicKey(aesKey, publicKey);
    });

    return {
      encryptedMessage,
      encryptedKeys
    };
  }
}