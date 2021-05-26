import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsPositive,
  IsNumber
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export type DeviceTypeStatic = 'car barrier' | 'human barrier' | 'elevator'
export type DeviceTypeNormal = 'human' | 'mobile' | 'other'

export type DeviceType = DeviceTypeNormal | DeviceTypeStatic

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

export class PhysicalAddressDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Address',
    example: 'Test Str 123',
    required: false
  })
  addressLine1?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Address',
    example: '2nd floor, room #234',
    required: false
  })
  addressLine2?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'City name',
    example: 'Test City',
    required: false
  })
  city?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Post Code',
    example: '11-111',
    required: false
  })
  postcode?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'State name or code',
    example: 'AZ',
    required: false
  })
  state?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Country name or code',
    example: 'USA',
    required: false
  })
  country?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Room number',
    example: '234',
    required: false
  })
  number?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Floor number',
    example: '2',
    required: false
  })
  floor?: string
}

export class DeviceDetailsDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: `Device type. Accepted values: ['car barrier', 'human barrier', 'elevator', 'human', 'mobile', 'other']`,
    example: 'mobile',
    required: false
  })
  deviceType?: DeviceType

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Device model.',
    example: 'TR-808',
    required: false
  })
  deviceModel?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Any additional description of the device',
    example: 'Lorem ipsum dolor sit amet',
    required: false
  })
  additionalDescription?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Asset URL',
    example: 'https://loremflickr.com/800/600',
    required: false
  })
  assetUrl?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Place for an URL of company, institution or something else',
    example: 'https://google.com',
    required: false
  })
  url?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'You can leave any contact info here',
    example: 'test@example.com, 123-456-789',
    required: false
  })
  contactInfo?: string

  @IsOptional()
  @ApiProperty({
    // TODO add description when a bug will be fixed
    // Nested attributes from third level downward will not work
    // correctly with 'description' attribute
    // https://github.com/nestjs/swagger/issues/724
    type: PhysicalAddressDto,
    required: false
  })
  physicalAddress?: PhysicalAddressDto
}

export class CreateDeviceDto {
  @IsString()
  @ApiProperty({
    description: 'Device name',
    example: 'Example device'
  })
  name: string

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
    example: 20.0,
    required: false
  })
  lat?: number

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Longitude',
    example: 15.0,
    required: false
  })
  lng?: number

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Altitude',
    example: 2400,
    required: false
  })
  alt?: number

  @IsString()
  @ApiProperty({
    description: 'Device type',
    example: 'device',
    default: 'device',
    required: false
  })
  type: string = 'device'

  @IsPositive()
  @IsOptional()
  @ApiProperty({
    description: '[Unused] - Price for a key to this device',
    example: 2400,
    required: false
  })
  price?: number

  @IsOptional()
  @ApiProperty({
    // Nested attributes from third level downward will not work
    // correctly with 'description' attribute
    // https://github.com/nestjs/swagger/issues/724

    // description: 'Additional information about this device',
    required: false,
    type: DeviceDetailsDto
  })
  details?: DeviceDetailsDto

  @IsOptional()
  @ApiProperty({
    description: 'custom fields',
    required: false,
    example: {
      foo: 'bar',
      bar: true,
      baz: 10
    }
  })
  custom?: {
    [key: string]: any
  }
}

export interface EditDeviceDto {
  [key: string]: string | number | boolean | null
}

export class EditDevice {
  @ApiProperty({
    example: 'value1',
    required: false
  })
  key1?: string

  @ApiProperty({
    example: 123,
    required: false
  })
  key2?: number
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
    example: 'urn:lo:nsid:blockchain:3P2pTpQhGbZrJXATKr75A1uZjeTrb4PHMYf'
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

export class DeviceConnectExistingDto {
  @IsString()
  @ApiProperty({
    description: 'ID of existing Device WITH all prefixes',
    example: 'urn:lo:nsid:blockchain:foobar'
  })
  deviceId: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '[Optional] Blockchain address to assign existing device to',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k',
    required: false
  })
  address?: string

  @IsOptional()
  @ApiProperty({
    description:
      "[Optional] Attributes of a new blockchain Device. Don't provide this attribute when connecting to an existing address",
    required: false
  })
  deviceParams?: CreateDeviceDto
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

export class DeviceConnectExistingResponse extends ConnectionDetailsResponse {
  @IsString()
  @ApiProperty({
    description: 'Connection status',
    example: 'device connected'
  })
  status: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Address of device on the blockchain',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  address?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'AES encrypted backup phrase. Returned only when creating a new blockchain address.',
    example:
      'U2FsdGVkX1+UHPgmbS60YfwtbnEB+h6y9Q9VoR1aqB+GYBB7LQW7Jxruasw6STPih3yk2/Ty79KMcp4SllG3b00P0IR/jpuyzTw1wQ5UHNCYk7YpqAuwwyxArlgWQP/IFdZkBWpJtVJ0PQ8ln8Odso5TlBhvEljxsRlGMe4uKks='
  })
  encryptedSeed?: string
}
