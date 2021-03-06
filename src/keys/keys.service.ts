import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'
import {
  CreateAndTransferKeyDto,
  CreateKeyDto,
  CreateKeyResult,
  CreateKeyRequestsDto
} from './keys.model'
import config from '../config'
import { SupplierService } from '../supplier/supplier.service'

@Injectable()
export class KeysService {
  constructor(
    private readonly blockchainWriteService: BlockchainWriteService,
    private readonly blockchainReadService: BlockchainReadService,
    private readonly supplierService: SupplierService
  ) {}

  async index(limit: number, after: string) {
    const nfts = await this.blockchainReadService.fetchNFTs(limit, after)
    const keys = nfts.map((nft: any) => {
      const { issuer, issueTimestamp, assetId, description } = nft
      const [device, validTo] = this.readDescription(description)

      return {
        issuer,
        issueTimestamp,
        assetId,
        device,
        validTo
      }
    })

    return keys
  }

  async create(createKeyDto: CreateKeyDto, tags?: string[]): Promise<CreateKeyResult[]> {
    this.validateTimestamp(createKeyDto.validTo)

    const keys = await Promise.all(
      [...Array(createKeyDto.amount)].map(() => this.createKey(createKeyDto))
    )

    const assetIds = keys.filter((key) => key.assetId).map((key) => key.assetId)

    const dataTx = await this.handleError(() =>
      this.blockchainWriteService.addNKeysToDevice(assetIds, createKeyDto.device)
    )

    // Do not wait for supplier response
    this.supplierService.onCreateKeys(createKeyDto, assetIds, tags)

    return keys.map((key) => {
      if (dataTx.success) {
        return { ...key, dataTx: dataTx.data }
      }

      return { ...key, success: false, error: dataTx.data }
    })
  }

  async show(assetId: string) {
    const details = await this.blockchainReadService.fetchAsset(assetId)
    const { issuer, issueTimestamp, description } = details
    const [device, validTo] = this.readDescription(description)

    return {
      assetId,
      issuer,
      issueTimestamp,
      device,
      validTo
    }
  }

  async transfer(assetId: string, address: string, tags?: string[]) {
    const [{ device, validTo }, txHash] = await Promise.all([
      this.show(assetId),
      this.blockchainWriteService.transfer(address, assetId)
    ])

    // Do not wait for supplier response
    this.supplierService.onCreateKeys(
      {
        device,
        validTo,
        amount: 1,
        recipient: address
      },
      [assetId],
      tags
    )

    return { txHash }
  }

  async burn(assetId: string) {
    const { dappAddress } = config().blockchain
    const balance = await this.blockchainReadService.assetBalance(dappAddress, assetId)

    if (balance !== 1) {
      throw new NotFoundException()
    }

    const txHash = await this.blockchainWriteService.burnKey(assetId)
    return { txHash }
  }

  async createAndTransfer(createAndTransferKeyDto: CreateAndTransferKeyDto) {
    const { amount, device, validTo, user } = createAndTransferKeyDto
    this.validateKeyLimit(amount)
    this.validateTimestamp(validTo)

    await this.supplierService.updateTransferStatus(device, true)

    const keys = await this.blockchainWriteService.generateNKeys(device, validTo, amount)

    await this.blockchainWriteService.addNKeysToDevice(keys, device)

    const promises = keys.map((key) => {
      return this.blockchainWriteService.transfer(user, key)
    })

    const hashes = await Promise.all(promises)

    return keys.map((assetId, index) => ({
      assetId,
      transfer: hashes[index]
    }))
  }

  async createForMultipleDevices(requestsDto: CreateKeyRequestsDto) {
    // validate timestamps
    requestsDto.requests.map((el) => this.validateTimestamp(el.validTo))

    // validate key limit
    this.validateKeyLimit(
      requestsDto.requests
        .map((e) => e.amount)
        .reduce((prevValue, currValue) => {
          return prevValue + currValue
        })
    )

    // create the keys
    const keyResponses = await Promise.all(
      requestsDto.requests.map(async (dto) => {
        return {
          device: dto.device,
          keys: await this.create(dto)
        }
      })
    )

    // In some cases no keys might be created(like no funds on dApp).
    // We should then return an error.
    // That's why we iterate over result to check if any keys were created.
    if (this.anyCreatedKeys(keyResponses)) {
      return keyResponses
    } else {
      throw new BadRequestException(['No keys have been created'])
    }
  }

  private async handleError<T>(func: () => Promise<T>) {
    try {
      return { success: true, data: await func() }
    } catch (err) {
      return {
        success: false,
        data: (err.response?.details?.message as string) ?? (err.message as string)
      }
    }
  }

  private readDescription(description: string): [string, number] {
    const values = description.split('_')
    return [values[0], parseInt(values[1] ?? '0')]
  }

  private validateKeyLimit(amount: number) {
    const maxAmount = 80

    if (amount > maxAmount) {
      throw new BadRequestException([`amount cannot exceed ${maxAmount}`])
    }
  }

  private validateTimestamp(timestamp: number) {
    const { minDuration } = config().key
    const minValue = Date.now() + minDuration

    if (Date.now() + minDuration >= timestamp) {
      throw new BadRequestException([`validTo should be greater than ${minValue}`])
    }
  }

  private async createKey(dto: CreateKeyDto) {
    const issueTx = await this.handleError(() =>
      this.blockchainWriteService.generateKey(dto.device, dto.validTo)
    )

    if (!issueTx.success) return { success: false, error: issueTx.data }

    if (dto.recipient === config().blockchain.dappAddress || !dto.recipient) {
      return {
        assetId: issueTx.data,
        success: true
      }
    }

    const transferTx = await this.handleError(() =>
      this.blockchainWriteService.transfer(dto.recipient, issueTx.data)
    )

    if (!transferTx.success) {
      return {
        assetId: issueTx.data,
        success: false,
        error: transferTx.data
      }
    }

    return {
      assetId: issueTx.data,
      transferTx: transferTx.data,
      success: true
    }
  }

  private anyCreatedKeys(keyResponses: { device: string; keys: CreateKeyResult[] }[]) {
    let validKeys = false

    keyResponses.forEach((keyResponse) => {
      keyResponse.keys.forEach((key) => {
        if (key.success) {
          validKeys = true
          return
        }
      })

      if (validKeys) {
        return
      }
    })

    return validKeys
  }
}
