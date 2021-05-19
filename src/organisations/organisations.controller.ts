import { Controller, Delete, Param, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { AddressValidationPipe, AssetIdValidationPipe } from '../validators'
import { RemoveKeyProperties } from './organisations.docs'
import { OrganisationsService } from './organisations.service'

@UseGuards(JwtAuthGuard)
@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Delete(':organisation/keys/:key')
  @RemoveKeyProperties()
  async removeKey(
    @Param('organisation', AddressValidationPipe) organisation: string,
    @Param('key', AssetIdValidationPipe) key: string
  ) {
    return await this.organisationsService.removeKey(organisation, key)
  }
}
