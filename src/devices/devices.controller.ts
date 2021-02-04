import {
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Delete,
  Body,
  Put
} from '@nestjs/common'
import { AddressValidationPipe } from '../validators'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateConnectionDto, EditDeviceDto } from './devices.model'
import { DevicesService } from './devices.service'

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async create() {
    return await this.devicesService.create()
  }

  @Get()
  async index() {
    return await this.devicesService.index()
  }

  @Get(':address')
  async show(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.show(address)
  }

  @Delete(':address')
  async destroy(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.destroy(address)
  }

  @Get(':address/connection')
  async connection(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.connection(address)
  }

  @Post(':address/connect')
  async connect(
    @Param('address', AddressValidationPipe) address: string,
    @Body() createConnectionDto: CreateConnectionDto
  ) {
    return await this.devicesService.connect(address, createConnectionDto)
  }

  @Delete(':address/disconnect')
  async disconnect(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.disconnect(address)
  }

  // TODO not tested
  @Put(':address')
  async edit(
    @Param('address', AddressValidationPipe) address: string,
    @Body() editDeviceDto: EditDeviceDto
  ) {
    return await this.devicesService.edit(address, editDeviceDto)
  }
}
