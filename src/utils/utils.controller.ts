import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { FaucetDto, SetupDto, SetupActionResponse, Status } from './utils.model'
import { UtilsService } from './utils.service'

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledForbiddenResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse,
  TransactionResponse
} from '../common/responses.swagger'

@UseGuards(JwtAuthGuard)
@Controller('utils')
@ApiTags('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  //
  // -------------------------------------------------------
  // POST /utils/faucet
  // -------------------------------------------------------
  //

  @Post('faucet')
  @ApiOperation({
    summary: 'Transfer funds for given address',
    description: 'Transfer funds from dApp to given address'
  })
  @ApiBearerAuth()
  @ApiFilledCustomErrorResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 201,
    description: 'Transfer completed',
    type: TransactionResponse
  })
  async faucet(@Body() faucetDto: FaucetDto) {
    return await this.utilsService.faucet(faucetDto)
  }

  //
  // -------------------------------------------------------
  // POST /utils/setup
  // -------------------------------------------------------
  //

  @Post('setup')
  @ApiOperation({
    summary: 'Set dApp data',
    description: 'Set dApp name, description and script template'
  })
  @ApiBearerAuth()
  @ApiFilledCustomErrorResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 201,
    description: 'Script set',
    type: SetupActionResponse
  })
  async setup(@Body() setupDto: SetupDto) {
    return await this.utilsService.setup(setupDto)
  }

  //
  // -------------------------------------------------------
  // GET /utils/status
  // -------------------------------------------------------
  //

  @Get('status')
  @ApiOperation({
    summary: 'Show configuration',
    description: 'Fetch data about the dApp'
  })
  @ApiBearerAuth()
  @ApiFilledCustomErrorResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 200,
    description: 'Valid response data',
    type: Status
  })
  async status() {
    return await this.utilsService.status()
  }
}
