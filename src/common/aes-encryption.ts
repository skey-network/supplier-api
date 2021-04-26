import { AES } from 'crypto-js';
import config from '../config'

const fetchSalt = (): string => {
  let key = config().encryptionSalt;
  if(!key) {
    throw new Error("Encryption salt has not been set! Please set ENV variable called ENCRYPTION_SALT")
  };

  return key;
}

export const encrypt = (message: string): string => {
  let key = fetchSalt();

  return AES.encrypt(message, key).toString();
}

export const decrypt = (message: string): string => {
  let key = fetchSalt();

  return AES.decrypt(message, key).toString(CryptoJS.enc.Utf8);
}