import config from '../config'

const CryptoJS = require('crypto-js');

const fetchSalt = (): string => {
  let key = config().encryptionSalt;
  if(!key) {
    console.log(key);
    throw new Error("Encryption salt has not been set! Please set ENV variable called ENCRYPTION_SALT")
  };

  return key;
}

export const encrypt = (message: string): string => {
  let key = fetchSalt();

  return CryptoJS.AES.encrypt(message, key).toString();
}

export const decrypt = (message: string): string => {
  let key = fetchSalt();

  return CryptoJS.AES.decrypt(message, key).toString(CryptoJS.enc.Utf8);
}