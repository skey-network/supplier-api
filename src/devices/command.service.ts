import { Injectable, NotFoundException } from '@nestjs/common'
import config from '../config'
import { DeviceCommandPayload, DeviceCommandResponse } from './devices.model'
import { getInstance } from 'skey-lib'
import { IInvokeScriptTransaction, verify } from '@waves/waves-transactions'
import { publicKeyToAddress } from '../common/crypto-helpers'

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain

@Injectable()
export class DevicesCommandService {
  private lib = getInstance({ nodeUrl, chainId })

  async deviceCommand(payload: DeviceCommandPayload): Promise<DeviceCommandResponse> {
    const key = await this.lib.fetchKey(payload.keyAssetId)
    return await this.interactWithDevice(payload, key.issuer)
  }

  async validateTransaction(
    deviceAddress: string,
    assetId: string,
    txParams: IInvokeScriptTransaction
  ) {
    try {
      await this.lib.fetchDevice(deviceAddress)
    } catch (e) {
      throw new NotFoundException('device not found')
    }

    // Change chain ID to correct one
    txParams.chainId = chainId.charCodeAt(0)

    // Validate transaction

    try {
      const result = verify(txParams)
      if (!result) {
        return { verified: false, error: 'Transaction not verified' }
      }
    } catch (e) {
      return { verified: false, error: e }
    }

    // Validate if user can interact with the device

    const interactionParams = {
      deviceAddress: deviceAddress,
      command: txParams.call.function,
      waitForTx: false,
      keyOwnerAddress: publicKeyToAddress(
        txParams.senderPublicKey,
        config().blockchain.chainId
      ),
      keyAssetId: assetId
    }

    const [keyVerified, error] = await this.canInteractDirectly(interactionParams)

    if (!keyVerified) {
      return { verified: false, error }
    }

    // TODO: Enqueue the transaction

    return { verified: true }
  }

  private async interactWithDevice(
    payload: DeviceCommandPayload,
    issuer: string
  ): Promise<DeviceCommandResponse> {
    if (payload.keyOwnerAddress !== dappAddress) {
      const txHash = await this.interactWithDeviceAsAddress(payload, issuer)
      return { script: 'deviceActionAs', txHash, waitForTx: payload.waitForTx }
    }

    if (payload.keyOwnerAddress === dappAddress) {
      const txHash = await this.interactWithDeviceAsDapp(payload, issuer)
      return { script: 'deviceAction', txHash, waitForTx: payload.waitForTx }
    }
  }

  private async interactWithDeviceAsAddress(payload: DeviceCommandPayload, dapp: string) {
    return await this.lib.interactWithDeviceAs(
      payload.keyAssetId,
      dapp,
      payload.command,
      dappSeed,
      payload.keyOwnerAddress,
      { waitForTx: payload.waitForTx }
    )
  }

  private async interactWithDeviceAsDapp(payload: DeviceCommandPayload, dapp: string) {
    return await this.lib.interactWithDevice(
      payload.keyAssetId,
      dapp,
      payload.command,
      dappSeed,
      { waitForTx: payload.waitForTx }
    )
  }

  async canInteractDirectly(
    payload: DeviceCommandPayload
  ): Promise<[boolean, string | undefined]> {
    // Things to check:

    // keyOwnerAddres acutally has the key
    // the key is valid
    // the key is whitelisted in the device

    const [keyIsWhitelisted, addressOwnsKey, keyIsValid] = await Promise.all([
      this.keyIsWhitelisted(payload.keyAssetId, dappAddress),
      this.addressOwnsKey(payload.keyAssetId, payload.keyOwnerAddress),
      this.keyIsValid(payload.keyAssetId, payload.deviceAddress)
    ])

    let error: string | undefined

    if (!keyIsWhitelisted) {
      error = 'key is not whitelisted in supplier'
    } else if (!addressOwnsKey) {
      error = 'address is not key owner'
    } else if (!keyIsValid) {
      error = 'key is invalid'
    }

    const result = addressOwnsKey && keyIsWhitelisted && keyIsValid

    return [result, error]
  }

  private async keyIsWhitelisted(assetId: string, address: string) {
    const whitelist = (await this.lib.fetchKeyWhitelist(address))
      .filter((item) => item.status === 'active')
      .map((item) => item.assetId)

    return whitelist.includes(assetId)
  }

  private async addressOwnsKey(assetId: string, address: string) {
    const height = await this.lib.fetchHeight()
    const owner = await this.lib.fetchKeyOwner(assetId, height - 1)

    return owner === address
  }

  private async keyIsValid(assetId: string, deviceAddress: string): Promise<boolean> {
    // Validate timestamp of key
    try {
      const keyDetails = await this.lib.fetchKey(assetId)

      const [descDeviceAddress, timestamp] = keyDetails.description.split('_')

      return descDeviceAddress === deviceAddress && timestamp >= Date.now().toString()
    } catch (e) {
      throw new NotFoundException('key not found')
    }
  }
}
