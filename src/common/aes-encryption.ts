import config from '../config'
import { Logger } from '../logger/Logger.service'

const CryptoJS = require('crypto-js')

const fetchSalt = (): string => {
  const key = config().encryptionSalt
  if (!key) {
    Logger.debug(key)
    throw new Error(
      'Encryption salt has not been set! Please set ENV variable called ENCRYPTION_SALT'
    )
  }

  return key
}

export const encrypt = (message: string): string => {
  const key = fetchSalt()

  return CryptoJS.AES.encrypt(message, key).toString()
}

export const decrypt = (message: string): string => {
  const key = fetchSalt()

  return CryptoJS.AES.decrypt(message, key).toString(CryptoJS.enc.Utf8)
}
