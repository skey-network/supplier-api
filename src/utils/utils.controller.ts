import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { FaucetDto, SetupDto } from './utils.model'
import { UtilsService } from './utils.service'

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledForbiddenResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse
} from '../common/responses.swagger'

@UseGuards(JwtAuthGuard)
@Controller('utils')
@ApiTags('utils')
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

  @Get('status')
  async status() {
    return await this.utilsService.status()
  }
}
