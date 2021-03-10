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
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import {
  AddressValidationPipe,
  AssetIdValidationPipe,
  LimitPipe,
  OptionalAssetIdValidationPipe
} from '../validators'
import { CreateAndTransferKeyDto, CreateKeyDto } from './keys.model'
import { KeysService } from './keys.service'

@UseGuards(JwtAuthGuard)
@Controller('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Get()
  async index(
    @Query('limit', LimitPipe) limit: number,
    @Query('after', OptionalAssetIdValidationPipe) after: string
  ) {
    return await this.keysService.index(limit, after)
  }

  @Post()
  async create(@Body() createKeyDto: CreateKeyDto) {
    return await this.keysService.create(createKeyDto)
  }

  @Get(':assetId')
  async show(@Param('assetId', AssetIdValidationPipe) assetId: string) {
    return await this.keysService.show(assetId)
  }

  @Put(':assetId/transfer/:address')
  async transfer(
    @Param('assetId', AssetIdValidationPipe) assetId: string,
    @Param('address', AddressValidationPipe) address: string
  ) {
    return await this.keysService.transfer(assetId, address)
  }

  @Delete(':assetId')
  async burn(@Param('assetId', AssetIdValidationPipe) assetId: string) {
    return await this.keysService.burn(assetId)
  }

  @Post('/generate_and_transfer')
  async generateAndTransferKey(
    @Body() createAndTransferKeyDto: CreateAndTransferKeyDto
  ) {
    return await this.keysService.createAndTransfer(createAndTransferKeyDto)
  }
}
