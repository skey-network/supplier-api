import config from '../config'

import * as Crypto from 'crypto-js'

// ENCRYPTION DETAILS
// https://www.devglan.com/online-tools/aes-encryption-decryption
// mode: CBC
// keySize: 256
// IV: set in ENV ENCRYPTION_IV
// SecretKey: password => SHA256 => first 32 letters
// outputFormat: Base64

const fetchSaltAndIv = () => {
  const enc = config().encryption
  if (!enc.salt || !enc.iv) {
    throw new Error(
      'Encryption salt or IV has not been set! Please set ENV variables called ENCRYPTION_SALT and ENCRYPTION_IV'
    )
  }

  return({
    salt: Crypto.enc.Utf8.parse(Crypto.SHA256(enc.salt).toString().substr(0, 32)),
    iv: Crypto.enc.Utf8.parse(enc.iv)
  })
}

export const encrypt = (text: string) => {
  const keys = fetchSaltAndIv()
  const enc = Crypto.AES.encrypt(text, keys.salt, { iv: keys.iv })

  return enc.ciphertext.toString(Crypto.enc.Base64)
}

export const decrypt = (text: string) => {
  const keys = fetchSaltAndIv()
  const dec = Crypto.AES.decrypt(text, keys.salt, { iv: keys.iv })

  return dec.toString(Crypto.enc.Utf8)
}
