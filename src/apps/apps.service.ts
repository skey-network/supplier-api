import { Injectable } from '@nestjs/common'
import { BlockchainReadService } from 'src/blockchain/blockchain.read.service'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import config from '../config'

@Injectable()
export class AppsService {
  constructor(
    private readonly blockchainWriteService: BlockchainWriteService,
    private readonly blockchainReadService: BlockchainReadService
  ) {}

  async rbbOpen(device: string) {
    const regex = 'key_.{32,44}'
    const keys = await this.blockchainReadService.fetchWithRegex(regex)
    console.log(keys)

    // const txHash = await this.blockchainWriteService.interactWithDevice(
    //   'open',
    //   '',
    //   config().apps.rbb.seed
    // )

    return { txHash: '89453yu045680uyg978rghou5uytg8h48gh487' }
  }
}
