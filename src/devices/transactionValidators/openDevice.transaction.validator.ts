import { NotFoundException } from '@nestjs/common'
import config from '../../config'
import { DeviceCommandPayload } from '../devices.model'
import { TransactionValidator, ValidationError } from './transaction.validator'

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain

export class OpenDeviceTransactionValidator extends TransactionValidator {
  async canInteractDirectly(
    payload: DeviceCommandPayload
  ): Promise<[boolean, string | undefined]> {
    try {
      await this.runValidationMethods(payload)
    } catch (e) {
      if (e instanceof ValidationError) {
        return [false, e.message]
      } else {
        throw e
      }
    }

    return [true, undefined]
  }

  protected async runValidationMethods(payload: DeviceCommandPayload): Promise<void> {
    // Things to check:

    // keyOwnerAddres acutally has the key
    // the key is valid
    // the key is whitelisted in the device
    // the device is whitelisted in the supplier

    await Promise.all([
      this.deviceIsWhitelisted(payload.deviceAddress, dappAddress),
      this.keyIsWhitelisted(payload.keyAssetId, payload.deviceAddress),
      this.addressOwnsKey(payload.keyAssetId, payload.keyOwnerAddress),
      this.keyIsValid(payload.keyAssetId, payload.deviceAddress)
    ])
  }

  protected async deviceIsWhitelisted(device: string, supplier: string) {
    const whitelist = (await this.lib.fetchDevices(supplier))
      .filter((item) => item.status === 'active')
      .map((item) => item.address)

    if (whitelist.includes(device)) {
      return true
    } else {
      throw new ValidationError('device is not whitelisted in supplier')
    }
  }

  protected async keyIsWhitelisted(assetId: string, address: string) {
    const whitelist = (await this.lib.fetchKeyWhitelist(address))
      .filter((item) => item.status === 'active')
      .map((item) => item.assetId)

    if (whitelist.includes(assetId)) {
      return true
    } else {
      throw new ValidationError('key is not whitelisted in device')
    }
  }

  protected async addressOwnsKey(assetId: string, address: string) {
    const height = await this.lib.fetchHeight()
    const owner = await this.lib.fetchKeyOwner(assetId, height - 1)

    if (owner === address) {
      return true
    } else {
      throw new ValidationError(this.addressOwnsKeyErrorMessage())
    }
  }

  protected addressOwnsKeyErrorMessage() {
    return 'address is not key owner'
  }

  protected async keyIsValid(assetId: string, deviceAddress: string): Promise<boolean> {
    // Fetch key data
    let keyDetails: any
    try {
      keyDetails = await this.lib.fetchKey(assetId)
    } catch (e) {
      throw new NotFoundException('key not found')
    }

    // const [descDeviceAddress, timestamp] = keyDetails.description.split('_')
    const { device, validTo } = this.lib.extractValuesFromKey(keyDetails.description)

    if (device !== deviceAddress) {
      // Key is for a different device
      throw new ValidationError('key is not assigned to this device')
    } else if (validTo < Date.now()) {
      // Key has expired
      throw new ValidationError('key has expired')
    } else {
      return true
    }
  }
}
