import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'
import { CreateAndTransferKeyDto, CreateKeyDto } from './keys.model'
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

  async create(createKeyDto: CreateKeyDto) {
    const { device, validTo, amount } = createKeyDto
    this.validateTimestamp(validTo)
    this.validateKeyLimit(amount)

    const keys = await this.blockchainWriteService.generateNKeys(device, validTo, amount)

    await this.blockchainWriteService.addNKeysToDevice(keys, device)
    return keys.map((key) => ({ assetId: key }))
  }

  async show(assetId: string) {
    const balance = await this.blockchainReadService.assetBalance(
      config().blockchain.dappAddress,
      assetId
    )

    if (balance !== 1) {
      throw new NotFoundException()
    }

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

  async transfer(assetId: string, address: string) {
    const txHash = await this.blockchainWriteService.transfer(address, assetId)
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

  private readDescription(description: string): [string, number] {
    const values = description.split('_')
    return [values[0], parseInt(values[1] ?? '0')]
  }

  private validateKeyLimit(amount: number) {
    const { maxAmount } = config().key

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
}
