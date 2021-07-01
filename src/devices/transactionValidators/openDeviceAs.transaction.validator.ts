import config from '../../config'
import { DeviceCommandPayload } from '../devices.model'
import { OpenDeviceTransactionValidator } from './openDevice.transaction.validator'
import { IInvokeScriptTransaction } from '@waves/waves-transactions'
import { publicKeyToAddress } from '../../common/crypto-helpers'
import { BlockchainReadService } from '../../blockchain/blockchain.read.service'
import { ValidationError } from './transaction.validator'

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain

export class OpenDeviceAsTransactionValidator extends OpenDeviceTransactionValidator {
  constructor(private readonly blockchainReadService: BlockchainReadService) {
    super()
  }

  protected async runValidationMethods(payload: DeviceCommandPayload): Promise<void> {
    // Things to check:

    // device is whitelisted in the supplier
    // key is whitelisted in the device
    // organisation acutally has the key
    // key is valid
    // user is a member of the organisation
    // the organisation is whitelisted in the supplier

    await Promise.all([
      this.deviceIsWhitelisted(payload.deviceAddress, dappAddress), // device is whitelisted in the supplier
      this.keyIsWhitelisted(payload.keyAssetId, payload.deviceAddress), // key is whitelisted in the device
      this.addressOwnsKey(payload.keyAssetId, payload.keyOwnerAddress), // organisation acutally has the key
      this.keyIsValid(payload.keyAssetId, payload.deviceAddress), // key is valid
      this.userIsInOrganisation(payload.callerAddress, payload.keyOwnerAddress), // user is a member of the organisation
      this.organisationIsWhitelisted(payload.keyOwnerAddress, dappAddress) // the organisation is whitelisted in the supplier
    ])
  }

  protected interactionParams(
    deviceAddress: string,
    assetId: string,
    txParams: IInvokeScriptTransaction
  ) {
    // func deviceActionAs (keyID,action,keyOwner)
    return {
      deviceAddress: deviceAddress,
      command: txParams.call.function,
      waitForTx: false,
      keyOwnerAddress: txParams.call.args[2].value.toString(), // organisation address
      keyAssetId: assetId,
      callerAddress: publicKeyToAddress(
        txParams.senderPublicKey,
        config().blockchain.chainId
      )
    }
  }

  private async userIsInOrganisation(
    callerAddress: string,
    organisation: string
  ): Promise<boolean> {
    const record = await this.blockchainReadService.readData(
      `user_${callerAddress}`,
      organisation
    )

    if (record !== 'active') {
      throw new ValidationError('user is not a member of the organisation')
    } else {
      return true
    }
  }

  private async organisationIsWhitelisted(
    organisation: string,
    supplierAddress: string
  ): Promise<boolean> {
    const record = await this.blockchainReadService.readData(
      `org_${organisation}`,
      supplierAddress
    )

    if (record !== 'active') {
      throw new ValidationError('organisation is not whitelisted in the supplier')
    } else {
      return true
    }
  }

  protected addressOwnsKeyErrorMessage() {
    return 'organisation does not own the key'
  }
}
