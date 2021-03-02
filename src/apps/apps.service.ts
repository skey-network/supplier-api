import { Injectable } from '@nestjs/common'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import config from '../config'

@Injectable()
export class AppsService {
  constructor(
    private readonly blockchainWriteService: BlockchainWriteService
  ) {}

  async rbbOpen(device: string) {
    // TODO
    // get key from data service

    // const txHash = await this.blockchainWriteService.interactWithDevice(
    //   'open',
    //   '',
    //   config().apps.rbb.seed
    // )

    return { txHash: '89453yu045680uyg978rghou5uytg8h48gh487' }
  }
}
