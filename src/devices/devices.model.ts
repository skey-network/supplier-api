import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsPositive,
  IsNumber
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateConnectionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'MSISDN number from device provider',
    example: '3213213213'
  })
  msisdn: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Server phone number from device provider',
    example: '45623'
  })
  serverPhoneNumber: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Default data stream ID from device provicer',
    example: '4562334564566'
  })
  defaultDataStreamId: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ICCID number from device provider',
    example: '0008949031122334455666'
  })
  iccid: string
}

export class CreateDeviceDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Device name',
    example: 'Example device',
    required: false
  })
  name?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Device description',
    example: 'Example device description',
    required: false
  })
  description?: string

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Latitude',
    example: '20.0',
    required: false
  })
  lat?: string

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Longitude',
    example: '15.0',
    required: false
  })
  lng?: string

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Altitude',
    example: '2400',
    required: false
  })
  alt?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Device type',
    example: 'Example device type',
    required: false
  })
  type?: string

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Is device connected',
    example: true,
    required: false
  })
  connected?: boolean

  @IsPositive()
  @IsOptional()
  @ApiProperty({
    description: '[Unused] - Price for a key to this device',
    example: 2400,
    required: false
  })
  price?: number
}

export interface EditDeviceDto {
  [key: string]: string | number | boolean | null
}

export class DeviceMessageDto {
  @IsString()
  @ApiProperty({
    description: 'timestamp',
    example: '2021-03-19T10:06:34Z'
  })
  timestamp: string

  @IsString()
  @ApiProperty({
    description: 'message data',
    example: 'Lon:20.518440 Lat:53.786247 External Voltage'
  })
  payload: string

  @IsString()
  @ApiProperty({
    description: 'device id',
    example: 'urn:lo:nsid:sms:3P2pTpQhGbZrJXATKr75A1uZjeTrb4PHMYf'
  })
  source: string
}

export class DeviceCommandDto {
  @IsString()
  @ApiProperty({
    description: 'Key owner address',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  keyOwnerAddress: string

  @IsString()
  @ApiProperty({
    description: 'Key asset ID',
    example: '9kY6qhKMRs4jHBPTHV1Pgdzqbo3X4XmBM7koAxwR9RTf'
  })
  keyAssetId: string
}

export class ConnectionDetailsResponse {
  @ApiProperty({
    description: 'Connection status',
    example: 'message'
  })
  status: string

  @ApiProperty({
    description: 'Connection details',
    example: {}
  })
  details: { [key: string]: string }
}

export interface DeviceCommandPayload {
  deviceAddress: string
  command: string
  waitForTx: boolean
  keyOwnerAddress: string
  keyAssetId: string
}

export interface DeviceCommandResponse {
  txHash: string
  script: string
  waitForTx: boolean
}

export class DeviceData {
  @ApiProperty({
    description: 'Device address',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  address: string

  @ApiProperty({
    description: 'Balance on the address',
    example: 500000000
  })
  balance: number

  @ApiProperty({
    description: 'DApp address',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  ownerDapp: string

  @ApiProperty({
    description: 'Is device connected?',
    example: true
  })
  connected: boolean
}
