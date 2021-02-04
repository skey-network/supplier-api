import { Injectable } from '@nestjs/common'
import { WavesWriteService } from '../waves/waves.write.service'
import { FaucetDto, SetupAction, SetupDto } from './utils.model'
import config from '../config'
import { WavesCompilerService } from '../waves/waves.compiler.service'

@Injectable()
export class UtilsService {
  constructor(
    private readonly wavesWriteService: WavesWriteService,
    private readonly wavesCompilerService: WavesCompilerService
  ) {}

  async faucet(payload: FaucetDto) {
    const { address, amount } = payload
    const txHash = await this.wavesWriteService.faucet(address, amount)
    return { txHash }
  }

  async setup(setupDto: SetupDto) {
    const steps: SetupAction[] = []

    if (setupDto.setScript) {
      const script = await this.wavesCompilerService.fetchScript('dapp')
      const { seed } = config().waves
      const txHash = await this.wavesWriteService.setScript(script, seed)
      steps.push({ action: 'setScript', txHash })
    }

    if (setupDto.name) {
      const txHash = await this.wavesWriteService.insertData([
        {
          key: 'name',
          value: setupDto.name
        }
      ])
      steps.push({ action: 'setName', txHash })
    }

    if (setupDto.description) {
      const txHash = await this.wavesWriteService.insertData([
        {
          key: 'description',
          value: setupDto.description
        }
      ])
      steps.push({ action: 'setDescription', txHash })
    }

    return steps
  }
}
