import { Injectable } from '@nestjs/common'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'
import { FaucetDto, SetupAction, SetupDto, StatusResponse } from './utils.model'
import config from '../config'
import { BlockchainCompilerService } from '../blockchain/blockchain.compiler.service'

@Injectable()
export class UtilsService {
  constructor(
    private readonly blockchainWriteService: BlockchainWriteService,
    private readonly blockchainCompilerService: BlockchainCompilerService,
    private readonly blockchainReadService: BlockchainReadService
  ) {}

  async faucet(payload: FaucetDto) {
    const { address, amount } = payload
    const txHash = await this.blockchainWriteService.faucet(address, amount)
    return { txHash }
  }

  async setup(setupDto: SetupDto) {
    const steps: SetupAction[] = []

    if (setupDto.setScript) {
      const script = await this.blockchainCompilerService.fetchScript('dapp')
      const { seed } = config().blockchain
      const txHash = await this.blockchainWriteService.setScript(script, seed)
      steps.push({ action: 'setScript', txHash })
    }

    if (setupDto.name) {
      const txHash = await this.blockchainWriteService.insertData([
        {
          key: 'name',
          value: setupDto.name
        }
      ])
      steps.push({ action: 'setName', txHash })
    }

    if (setupDto.description) {
      const txHash = await this.blockchainWriteService.insertData([
        {
          key: 'description',
          value: setupDto.description
        }
      ])
      steps.push({ action: 'setDescription', txHash })
    }

    return steps
  }

  async status() {
    const conf = config()

    const name: string = await this.blockchainReadService.readData(
      'name',
      conf.blockchain.dappAddress
    )
    const description: string = await this.blockchainReadService.readData(
      'description',
      conf.blockchain.dappAddress
    )
    const scriptInfo = this.blockchainReadService
      .fetchScript(conf.blockchain.dappAddress)
      .then((_) => true)
      .catch((_) => false)

    const status: StatusResponse = {
      address: conf.blockchain.dappAddress,
      script: await scriptInfo,
      name: name,
      description: description,
      nodeUrl: conf.blockchain.nodeUrl,
      chainId: conf.blockchain.chainId
    }

    return status
  }
}
