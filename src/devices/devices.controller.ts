import {
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Delete,
  Body,
  Put,
  Query
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
import { DevicesCommandService } from './command.service'
import { Device, ConnectionDetailsResponse } from './devices.model'

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse,
  TransactionResponse
} from '../common/responses.swagger'

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly devicesCommandService: DevicesCommandService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Add a new device',
    description: `This request performs multiple actions: \n
    - create new waves account \n
    - transfer funds to this account \n
    - set account script on this account \n
    - add device address to dApp storage`
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({ status: 201, description: 'Device created successfully', type: Device })
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return await this.devicesService.create(createDeviceDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'List of all devices',
    description: 'Fetch all devices from dApp and forward to client',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 200,
    type: String,
    isArray: true
  })
  async index() {
    return await this.devicesService.index()
  }

  @UseGuards(JwtAuthGuard)
  @Get(':address')
  @ApiOperation({
    summary: 'Get details of device',
    description: 'Fetches device details',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({ status: 200, description: 'Device data fetched', type: Device })
  async show(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.show(address)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':address')
  @ApiOperation({
    summary: 'Remove Device',
    description: 'Remove device from dApp'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({
    status: 200,
    description: 'Device removed successfully',
    type: TransactionResponse
  })
  async destroy(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.destroy(address)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':address/keys/:assetId')
  @ApiOperation({
    summary: 'Add key to device whitelist',
    description: 'Add key to device whitelist'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({
    status: 200,
    description: 'Key added successfully',
    type: TransactionResponse
  })
  async addKey(
    @Param('address', AddressValidationPipe) address: string,
    @Param('assetId', AssetIdValidationPipe) assetId: string
  ) {
    return await this.devicesService.addKey(address, assetId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':address/keys/:assetId')
  @ApiOperation({
    summary: 'Remove key from device whitelist',
    description: 'Remove key from device whitelist'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Key removed successfully',
    type: TransactionResponse
  })
  async removeKey(
    @Param('address', AddressValidationPipe) address: string,
    @Param('assetId', AssetIdValidationPipe) assetId: string
  ) {
    return await this.devicesService.removeKey(address, assetId)
  }

  // TODO not tested
  @UseGuards(JwtAuthGuard)
  @Put(':address')
  @ApiOperation({
    summary: 'Edit device data',
    description: 'Edit any values in device data storage'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({ status: 201, description: 'Device updated', type: TransactionResponse })
  async edit(
    @Param('address', AddressValidationPipe) address: string,
    @Body() editDeviceDto: EditDeviceDto
  ) {
    return await this.devicesService.edit(address, editDeviceDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':address/connection')
  @ApiOperation({
    summary: 'Get details of provider connection',
    description: 'Get details of provider connection'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({
    status: 200,
    description: 'Connection details fetched',
    type: ConnectionDetailsResponse
  })
  async connection(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.connection(address)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':address/connect')
  @ApiOperation({
    summary: 'Connect device to provider',
    description: 'Connect device to orange live objects and update status in dApp'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({
    status: 200,
    description: 'Device connected successfully',
    type: ConnectionDetailsResponse
  })
  async connect(
    @Param('address', AddressValidationPipe) address: string,
    @Body() createConnectionDto: CreateConnectionDto
  ) {
    return await this.devicesService.connect(address, createConnectionDto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':address/disconnect')
  @ApiOperation({
    summary: 'Disconnect device from provider',
    description: 'Disconnect device from orange live objects and update status in dApp'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({
    status: 200,
    description: 'Device disconnected successfully',
    type: TransactionResponse
  })
  async disconnect(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.disconnect(address)
  }

  @Post('device_message')
  @ApiOperation({
    summary: 'Endpoint for IoT',
    description: 'Endpoint for IoT'
  })
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({ status: 200, description: 'Device disconnected successfully' })
  async deviceMessage(@Body() deviceMessageDto: DeviceMessageDto) {
    return await this.devicesService.deviceMessage(deviceMessageDto)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':address/commands/:command')
  @ApiOperation({
    summary: 'Send a command to the device',
    description: 'Send a command to the device'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({ status: 200, description: 'Command sent' })
  async command(
    @Param('address') deviceAddress: string,
    @Param('command') command: string,
    @Body() deviceCommandDto: DeviceCommandDto,
    @Query('waitForTx') waitForTx: string
  ) {
    let wait: boolean

    if (waitForTx !== 'true' && waitForTx !== 'false') {
      wait = true
    }
    if (waitForTx === 'false') {
      wait = false
    }
    if (waitForTx === 'true') {
      wait = true
    }

    return await this.devicesCommandService.deviceCommand({
      deviceAddress,
      command,
      waitForTx: wait,
      ...deviceCommandDto
    })
  }
}
