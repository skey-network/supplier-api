import config from '../../config'
import { DeviceCommandPayload } from '../devices.model'
import { getInstance } from 'skey-lib'
import { IInvokeScriptTransaction, verify } from '@waves/waves-transactions'
import { publicKeyToAddress } from '../../common/crypto-helpers'

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain

export class ValidationError extends Error {}

export abstract class TransactionValidator {
  protected lib = getInstance({ nodeUrl, chainId })

  async validate(
    deviceAddress: string,
    assetId: string,
    txParams: IInvokeScriptTransaction
  ) {
    // Change chain ID to correct one
    txParams.chainId = chainId.charCodeAt(0)

    // Validate that transaction is signed
    const res = this.validateTransaction(txParams)

    if (!res.verified) {
      return res
    }

    // Validate if user can interact with the device
    return await this.validateInteraction(deviceAddress, assetId, txParams)
  }

  protected async validateInteraction(
    deviceAddress: string,
    assetId: string,
    txParams: IInvokeScriptTransaction
  ) {
    const [keyVerified, error] = await this.canInteractDirectly(
      this.interactionParams(deviceAddress, assetId, txParams)
    )

    return { verified: keyVerified, error }
  }

  protected interactionParams(
    deviceAddress: string,
    assetId: string,
    txParams: IInvokeScriptTransaction
  ) {
    const callerAddress = publicKeyToAddress(
      txParams.senderPublicKey,
      config().blockchain.chainId
    )
    return {
      deviceAddress: deviceAddress,
      command: txParams.call.function,
      waitForTx: false,
      keyOwnerAddress: callerAddress,
      callerAddress: callerAddress,
      keyAssetId: assetId
    }
  }

  abstract canInteractDirectly(
    payload: DeviceCommandPayload
  ): Promise<[boolean, string | undefined]>

  private validateTransaction(txParams: IInvokeScriptTransaction) {
    try {
      const result = verify(txParams)
      if (!result) {
        return { verified: false, error: 'Transaction not verified' }
      }

      return { verified: true }
    } catch (e) {
      return { verified: false, error: e }
    }
  }
}
