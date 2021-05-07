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
  EditDevice,
  CreateConnectionDto,
  DeviceMessageDto,
  DeviceCommandDto,
  DeviceConnectExistingDto,
  DeviceConnectExistingResponse
} from './devices.model'
import { DevicesService } from './devices.service'
import { DevicesCommandService } from './command.service'
import { Logger } from '../logger/Logger.service'
import { ConnectionDetailsResponse, DeviceData } from './devices.model'

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody
} from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse,
  TransactionResponse,
  BlockchainAddress
} from '../common/responses.swagger'

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly devicesCommandService: DevicesCommandService
  ) {}

  //
  // -------------------------------------------------------
  // POST /devices
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Add a new device',
    description: `Create a new blockchain account for a device`
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 201,
    description: 'Device created successfully',
    type: BlockchainAddress
  })
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return await this.devicesService.create(createDeviceDto)
  }

  //
  // -------------------------------------------------------
  // GET /devices
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'List of all devices',
    description: 'Fetch blockchain addresses of all devices from dApp',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 200,
    schema: {
      items: {
        type: 'string'
      },
      example: [
        '3MwzVVTXiYGQsp48VX8adQ8cpqERGusRZfD',
        '2NBPqqjDH2eYmoHeXNPnHhLvA7D4UDQXQcx',
        '7MvTY6UrP8PHPv5DYTs1uCQ8HSQ3tkP6JdQ'
      ]
    }
  })
  async index() {
    return await this.devicesService.index()
  }

  //
  // -------------------------------------------------------
  // GET /devices/:address
  // -------------------------------------------------------
  //

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
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Device data',
    type: DeviceData
  })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  async show(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.show(address)
  }

  //
  // -------------------------------------------------------
  // DELETE /devices/:address
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Delete(':address')
  @ApiOperation({
    summary: 'Remove Device',
    description: 'Remove device from dApp'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Device removed successfully',
    type: TransactionResponse
  })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  async destroy(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.destroy(address)
  }

  //
  // -------------------------------------------------------
  // POST /devices/:address/keys/:assetId
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Post(':address/keys/:assetId')
  @ApiOperation({
    summary: 'Add key to device whitelist',
    description: 'Add key to device whitelist'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Key added successfully',
    type: TransactionResponse
  })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  @ApiParam({
    name: 'assetId',
    description: 'ID of asset',
    example: '7HbEUg9yWMGtJ9dNW24rvcseiPYXAAaCoe23StkcyWXS'
  })
  async addKey(
    @Param('address', AddressValidationPipe) address: string,
    @Param('assetId', AssetIdValidationPipe) assetId: string
  ) {
    return await this.devicesService.addKey(address, assetId)
  }

  //
  // -------------------------------------------------------
  // DELETE /devices/:address/keys/:assetId
  // -------------------------------------------------------
  //

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
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  @ApiParam({
    name: 'assetId',
    description: 'ID of asset',
    example: '7HbEUg9yWMGtJ9dNW24rvcseiPYXAAaCoe23StkcyWXS'
  })
  async removeKey(
    @Param('address', AddressValidationPipe) address: string,
    @Param('assetId', AssetIdValidationPipe) assetId: string
  ) {
    return await this.devicesService.removeKey(address, assetId)
  }

  //
  // -------------------------------------------------------
  // PUT /devices/:address
  // -------------------------------------------------------
  //

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
  @ApiResponse({ status: 200, description: 'Device updated', type: TransactionResponse })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  @ApiBody({ type: EditDevice })
  async edit(
    @Param('address', AddressValidationPipe) address: string,
    @Body() editDeviceDto: EditDeviceDto
  ) {
    return await this.devicesService.edit(address, editDeviceDto)
  }

  //
  // -------------------------------------------------------
  // GET /devices/:address/connection
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Get(':address/connection')
  @ApiOperation({
    summary: 'Get details of provider connection',
    description: 'Get details of provider connection'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Connection details',
    type: ConnectionDetailsResponse
  })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  async connection(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.connection(address)
  }

  //
  // -------------------------------------------------------
  // POST /devices/:address/connect
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Post(':address/connect')
  @ApiOperation({
    summary: 'Connect device to provider',
    description: 'Connect device to Orange Live Object'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Device connected successfully',
    type: ConnectionDetailsResponse
  })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  async connect(
    @Param('address', AddressValidationPipe) address: string,
    @Body() createConnectionDto: CreateConnectionDto
  ) {
    return await this.devicesService.connect(address, createConnectionDto)
  }

  //
  // -------------------------------------------------------
  // DELETE /devices/:address/disconnect
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Delete(':address/disconnect')
  @ApiOperation({
    summary: 'Disconnect device from provider',
    description: 'Disconnect device from Orange Live Object'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({
    status: 200,
    description: 'Device disconnected successfully',
    type: TransactionResponse
  })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  async disconnect(@Param('address', AddressValidationPipe) address: string) {
    return await this.devicesService.disconnect(address)
  }

  //
  // -------------------------------------------------------
  // POST /devices/device_message
  // -------------------------------------------------------
  //

  @Post('device_message')
  @ApiOperation({
    summary: 'Send a message to IoT',
    description: 'Send a message to IoT'
  })
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 201,
    description: 'Successful message',
    schema: { example: {} }
  })
  async deviceMessage(@Body() deviceMessageDto: DeviceMessageDto) {
    return await this.devicesService.deviceMessage(deviceMessageDto)
  }

  //
  // -------------------------------------------------------
  // POST /devices/:address/commands/:command
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Post(':address/commands/:command')
  @ApiOperation({
    summary: 'Send a command to the device',
    description: 'Send a command to the device'
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({ status: 200, description: 'Command sent' })
  @ApiParam({
    name: 'address',
    description: 'Device address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  @ApiParam({
    name: 'command',
    description: 'Name of the command to execute',
    example: 'open'
  })
  @ApiParam({
    name: 'waitForTx',
    description: 'Send true to wait for response from the blockchain',
    example: 'true'
  })
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

  //
  // -------------------------------------------------------
  // POST /devices/:address/commands/:command
  // -------------------------------------------------------
  //

  @UseGuards(JwtAuthGuard)
  @Post('connect_existing')
  @ApiOperation({
    summary: 'Connect an existing Device to the blockchain',
    description: `
    Connect an existing LO Device to the blockchain
    Providing 'address' param will connect the device to an existing blockchain account and not providing it will create a new one.
    Connecting to a new blockchain account will return encrypted seed of the account.
    Do not provide 'deviceParams' parameter when connecting to an existing account.
    See schema of the request body for details.
    NOTE: Successfull operation will change the ID of LO Device to a following format:
    urn:lo:nsid:sms:{blockchainAddress}
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Device connected successfully',
    type: DeviceConnectExistingResponse
  })
  @ApiBearerAuth()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiFilledCustomErrorResponse()
  async connectExisting(@Body() deviceConnectExistingDto: DeviceConnectExistingDto) {
    return await this.devicesService.connectExisting(deviceConnectExistingDto)
  }
}
