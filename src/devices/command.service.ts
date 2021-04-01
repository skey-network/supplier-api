import { Injectable } from '@nestjs/common'
import config from '../config'
import { DeviceCommandPayload, DeviceCommandResponse } from './devices.model'
import { getInstance } from 'skey-lib'

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain

@Injectable()
export class DevicesCommandService {
  private lib = getInstance({ nodeUrl, chainId })

  async deviceCommand(payload: DeviceCommandPayload): Promise<DeviceCommandResponse> {
    const key = await this.lib.fetchKey(payload.keyAssetId)

    return await this.interactWithDevice(payload, key.issuer)
  }

  private async interactWithDevice(
    payload: DeviceCommandPayload,
    issuer: string
  ): Promise<DeviceCommandResponse> {
    if (issuer !== dappAddress && payload.keyOwnerAddress !== dappAddress) {
      const txHash = await this.interactWithDeviceAsAddress(payload, issuer)
      return { script: 'deviceActionAs', txHash }
    }

    if (issuer !== dappAddress && payload.keyOwnerAddress === dappAddress) {
      const txHash = await this.interactWithDeviceAsDapp(payload, issuer)
      return { script: 'deviceAction', txHash }
    }
  }

  private async interactWithDeviceAsAddress(payload: DeviceCommandPayload, dapp: string) {
    return await this.lib.interactWithDeviceAs(
      payload.keyAssetId,
      dapp,
      payload.command,
      dappSeed,
      payload.keyOwnerAddress
    )
  }

  private async interactWithDeviceAsDapp(payload: DeviceCommandPayload, dapp: string) {
    return await this.lib.interactWithDevice(
      payload.keyAssetId,
      dapp,
      payload.command,
      dappSeed
    )
  }

  // private async canInteractDirectly(
  //   payload: DeviceCommandPayload
  // ): Promise<[boolean, string | undefined]> {
  //   const [keyIsWhitelisted, addressOwnsKey, dappIsWhitelisted] = await Promise.all([
  //     this.keyIsWhitelisted(payload.keyAssetId, payload.deviceAddress),
  //     this.addressOwnsKey(payload.keyAssetId, payload.keyOwnerAddress),
  //     this.dappIsWhitelisted(payload.keyOwnerAddress)
  //   ])

  //   let error: string | undefined

  //   if (!keyIsWhitelisted) {
  //     error = 'key is not whitelisted in device'
  //   }
  //   if (!addressOwnsKey) {
  //     error = 'address is not key owner'
  //   }
  //   if (!dappIsWhitelisted) {
  //     error = 'dapp is not whitelisted in given address'
  //   }

  //   const result = addressOwnsKey && keyIsWhitelisted && dappIsWhitelisted

  //   return [result, error]
  // }

  // private async keyIsWhitelisted(assetId: string, address: string) {
  //   const whitelist = (await this.lib.fetchKeyWhitelist(address))
  //     .filter((item) => item.status === 'active')
  //     .map((item) => item.assetId)

  //   return whitelist.includes(assetId)
  // }

  // private async addressOwnsKey(assetId: string, address: string) {
  //   const height = await this.lib.fetchHeight()
  //   const owner = await this.lib.fetchKeyOwner(assetId, height - 1)

  //   return owner === address
  // }

  // private async dappIsWhitelisted(address: string) {
  //   const whitelist = (await this.lib.fetchDataWithRegex('user_.{35}', address))
  //     .filter((item) => item.value === 'active')
  //     .map((item) => item.key.replace('user_', ''))

  //   return whitelist.includes(dappAddress)
  // }
}
