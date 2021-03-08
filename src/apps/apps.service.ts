import { BadRequestException, Injectable } from '@nestjs/common'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import config from '../config'

@Injectable()
export class AppsService {
  constructor(
    private readonly blockchainWriteService: BlockchainWriteService,
    private readonly blockchainReadService: BlockchainReadService
  ) {}

  async rbbOpen(device: string) {
    const { address, seed } = config().apps.rbb

    const regex = 'key_.{32,44}'
    const entries = await this.blockchainReadService.fetchWithRegex(
      regex,
      device
    )
    const keyWhitelist = entries.map((entry) => entry.key.replace('key_', ''))

    const keys = await this.blockchainReadService.fetchAllNFTs(address)

    const validKeys = keys
      .filter((key) => this.isValidKey(key, device))
      .filter((key) => keyWhitelist.includes(key.assetId))

    if (validKeys.length === 0) {
      throw new BadRequestException('no valid keys found for this device')
    }

    const txHash = await this.blockchainWriteService.interactWithDevice(
      'open',
      validKeys[0].assetId,
      seed
    )

    return { txHash }
  }

  private isValidKey(key: { description: string }, device: string) {
    const desc = key.description.split('_')
    const [address, validTo] = desc

    if (Number(validTo) < Date.now()) return false
    if (device !== address) return false

    return true
  }
}
