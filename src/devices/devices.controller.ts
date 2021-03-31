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
import { AddressValidationPipe, AssetIdValidationPipe } from '../validators'
import { JwtAuthGuard } from '../auth/jwt.guard'
import {
  CreateDeviceDto,
  EditDeviceDto,
  CreateConnectionDto,
  DeviceMessageDto,
  DeviceCommandDto
} from './devices.model'
import { DevicesService } from './devices.service'

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return await this.devicesService.create(createDeviceDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index() {
    return await this.devicesService.index()
  }

  @UseGuards(JwtAuthGuard)
  @Get(':address')
  async show(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.show(address)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':address')
  async destroy(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.destroy(address)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':address/keys/:assetId')
  async addKey(
    @Param('address', AddressValidationPipe) address: string,
    @Param('assetId', AssetIdValidationPipe) assetId: string
  ) {
    return await this.devicesService.addKey(address, assetId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':address/keys/:assetId')
  async removeKey(
    @Param('address', AddressValidationPipe) address: string,
    @Param('assetId', AssetIdValidationPipe) assetId: string
  ) {
    return await this.devicesService.removeKey(address, assetId)
  }

  // TODO not tested
  @UseGuards(JwtAuthGuard)
  @Put(':address')
  async edit(
    @Param('address', AddressValidationPipe) address: string,
    @Body() editDeviceDto: EditDeviceDto
  ) {
    return await this.devicesService.edit(address, editDeviceDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':address/connection')
  async connection(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.connection(address)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':address/connect')
  async connect(
    @Param('address', AddressValidationPipe) address: string,
    @Body() createConnectionDto: CreateConnectionDto
  ) {
    return await this.devicesService.connect(address, createConnectionDto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':address/disconnect')
  async disconnect(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.disconnect(address)
  }

  @Post('device_message')
  async deviceMessage(@Body() deviceMessageDto: DeviceMessageDto) {
    return await this.devicesService.deviceMessage(deviceMessageDto)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':address/command')
  async command(
    @Param('address') deviceAddress: string,
    @Body() deviceCommandDto: DeviceCommandDto
  ) {
    return await this.devicesService.deviceCommand(deviceAddress, deviceCommandDto)
  }
}
