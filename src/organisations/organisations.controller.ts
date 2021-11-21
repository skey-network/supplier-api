import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { AddressValidationPipe, AssetIdValidationPipe } from '../validators'
import {
  OrganisationIndexProperties,
  RemoveKeyProperties,
  AddOrganisationProperties
} from './organisations.docs'
import { OrganisationsService } from './organisations.service'

@UseGuards(JwtAuthGuard)
@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get('')
  @OrganisationIndexProperties()
  async organisationsIndex() {
    return await this.organisationsService.organisationsIndex()
  }

  @Post(':address')
  @AddOrganisationProperties()
  async addOrganisation(@Param('address', AddressValidationPipe) address: string) {
    return await this.organisationsService.addOrganisation(address)
  }

  @Delete(':organisation/keys/:key')
  @RemoveKeyProperties()
  async removeKey(
    @Param('organisation', AddressValidationPipe) organisation: string,
    @Param('key', AssetIdValidationPipe) key: string
  ) {
    return await this.organisationsService.removeKey(organisation, key)
  }
}
