import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import config from '../config'
import { DeviceCommandPayload, DeviceCommandResponse } from './devices.model'
import { getInstance } from 'skey-lib'
import { IInvokeScriptTransaction } from '@waves/waves-transactions'
import { TransactionValidator } from './transactionValidators/transaction.validator'
import { OpenDeviceTransactionValidator } from './transactionValidators/openDevice.transaction.validator'
import { OpenDeviceAsTransactionValidator } from './transactionValidators/openDeviceAs.transaction.validator'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'

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
  ): Promise<{ verified: boolean; error?: string }> {
    try {
      await this.lib.fetchDevice(deviceAddress)
    } catch (e) {
      throw new NotFoundException('device not found')
    }

    // Change chain ID to correct one
    txParams.chainId = chainId.charCodeAt(0)

    if (!txParams.type) {
      return this.verificationError('No transaction found')
    } else if (txParams.type !== 16) {
      return this.verificationError(
        'Invalid transaction type. Only InvokeScript transactions are supported.'
      )
    }

    // Validate transaction

    let validator: TransactionValidator

    switch (txParams.call.function) {
      case 'deviceAction':
        validator = new OpenDeviceTransactionValidator()
        break
      case 'deviceActionAs':
        validator = new OpenDeviceAsTransactionValidator(new BlockchainReadService())
        break
      default:
        return this.verificationError(
          'Function not supported. Only supported functions are `deviceAction` and `deviceActionAs`'
        )
    }

    const validationRes = await validator.validate(deviceAddress, assetId, txParams)

    if (validationRes.verified) {
      // TODO enqueue the transaction
    }

    return validationRes
  }

  private verificationError(error: string) {
    return {
      verified: false,
      error: error
    }
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
}
