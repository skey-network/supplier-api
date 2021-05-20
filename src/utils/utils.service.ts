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

    if(setupDto.alias) {
      const txHash = await this.blockchainWriteService.setDAppAlias(setupDto.alias)

      steps.push({ action: 'setAlias', txHash })
    }

    return steps
  }

  async status() {
    const entriesRegex = '^(name|description)$'
    const { dappAddress, nodeUrl, chainId } = config().blockchain

    const getData = async () => {
      const entries = await this.blockchainReadService.fetchWithRegex(
        entriesRegex,
        dappAddress
      )

      return {
        name: entries.find((e) => e.key === 'name')?.value,
        description: entries.find((e) => e.key === 'description')?.value
      }
    }

    const [script, data, aliases] = await Promise.all([
      this.blockchainReadService.fetchScript(),
      getData(),
      this.blockchainReadService.fetchDAppAliases()
    ])

    return { address: dappAddress, script: !!script, ...data, nodeUrl, chainId, aliases }
  }
}
