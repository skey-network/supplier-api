import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { FaucetDto, SetupDto } from './utils.model'
import { UtilsService } from './utils.service'

@UseGuards(JwtAuthGuard)
@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Post('faucet')
  async faucet(@Body() faucetDto: FaucetDto) {
    return await this.utilsService.faucet(faucetDto)
  }

  @Post('setup')
  async setup(@Body() setupDto: SetupDto) {
    return await this.utilsService.setup(setupDto)
  }
}
