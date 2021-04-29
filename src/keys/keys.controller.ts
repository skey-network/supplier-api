import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt.guard'
import {
  AddressValidationPipe,
  AssetIdValidationPipe,
  LimitPipe,
  OptionalAssetIdValidationPipe
} from '../validators'
import {
  CreateAndTransferKeyDto,
  CreateKeyDto,
  CreateKeyResultResponse,
  CreateKeyResultResponseWithError,
  KeyExample
} from './keys.model'
import { KeysService } from './keys.service'

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty, ApiParam } from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse,
  TransactionResponse,
  AssetTransactionResponse
} from '../common/responses.swagger'

@UseGuards(JwtAuthGuard)
@ApiTags('keys')
@Controller('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  //
  // -------------------------------------------------------
  // GET /keys
  // -------------------------------------------------------
  //

  @Get()
  @ApiOperation({
    summary: 'List all keys',
    description: 'Fetch keys from dApp',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({ status: 200, description: 'List of keys', type: String, isArray: true })
  @ApiParam({ name: 'limit', description: 'Number of keys to be returned (defaults to 50)', example: 50 })
  @ApiParam({ name: 'after', description: 'AssetId of key to paginate after (defaults to first token)', example: '9kY6qhKMRs4jHBPTHV1Pgdzqbo3X4XmBM7koAxwR9RTf' })
  async index(
    @Query('limit', LimitPipe) limit: number,
    @Query('after', OptionalAssetIdValidationPipe) after: string
  ) {
    return await this.keysService.index(limit, after)
  }

  //
  // -------------------------------------------------------
  // POST /keys
  // -------------------------------------------------------
  //

  @Post()
  @ApiOperation({
    summary: 'Generate new keys',
    description:
      'Generate new keys and transfer to multiple addresses. Maximal amount of keys created in single request is 80.'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 400,
    description: 'Errors while creating keys',
    type: CreateKeyResultResponseWithError
  })
  @ApiResponse({
    status: 201,
    description: 'Keys generated',
    type: CreateKeyResultResponse
  })
  async create(@Body() createKeyDto: CreateKeyDto) {
    return await this.keysService.create(createKeyDto)
  }

  //
  // -------------------------------------------------------
  // GET /keys/:assetId
  // -------------------------------------------------------
  //

  @Get(':assetId')
  @ApiOperation({
    summary: 'Get details of key',
    description: 'Fetches data from blockchain',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({ status: 200, description: 'Key data fetched', type: KeyExample })
  @ApiParam({ name: 'assetId', description: 'Key asset id', example: '9kY6qhKMRs4jHBPTHV1Pgdzqbo3X4XmBM7koAxwR9RTf' })
  async show(@Param('assetId', AssetIdValidationPipe) assetId: string) {
    return await this.keysService.show(assetId)
  }

  //
  // -------------------------------------------------------
  // PUT /keys/:assetId/transfer/:address
  // -------------------------------------------------------
  //

  @Put(':assetId/transfer/:address')
  @ApiOperation({
    summary: 'Transfer key to address',
    description: 'Transfer key to address'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Key transferred successfully',
    type: TransactionResponse
  })
  @ApiParam({ name: 'assetId', description: 'Key asset id', example: '9kY6qhKMRs4jHBPTHV1Pgdzqbo3X4XmBM7koAxwR9RTf' })
  @ApiParam({ name: 'address', description: 'Address to transfer key to', example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud' })
  async transfer(
    @Param('assetId', AssetIdValidationPipe) assetId: string,
    @Param('address', AddressValidationPipe) address: string
  ) {
    return await this.keysService.transfer(assetId, address)
  }

  //
  // -------------------------------------------------------
  // DELETE /keys/:assetId
  // -------------------------------------------------------
  //

  @Delete(':assetId')
  @ApiOperation({
    summary: 'Burn/delete key',
    description: "Burn/delete a key - to be able to burn it, it has to be on the dApp account"
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Key burned successfully',
    type: TransactionResponse
  })
  @ApiParam({ name: 'assetId', description: 'Key asset id', example: '9kY6qhKMRs4jHBPTHV1Pgdzqbo3X4XmBM7koAxwR9RTf' })
  async burn(@Param('assetId', AssetIdValidationPipe) assetId: string) {
    return await this.keysService.burn(assetId)
  }

  //
  // -------------------------------------------------------
  // POST /keys/generate_and_transfer
  // -------------------------------------------------------
  //

  @Post('/generate_and_transfer')
  @ApiOperation({
    summary: 'Generate and transfer keys',
    description:
      'Generate keys for device and transfer to user. The maximum amount is 80.',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Keys generated successfully',
    type: AssetTransactionResponse
  })
  async generateAndTransferKey(@Body() createAndTransferKeyDto: CreateAndTransferKeyDto) {
    return await this.keysService.createAndTransfer(createAndTransferKeyDto)
  }
}
