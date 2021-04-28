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
  msisdn: string

  @IsNotEmpty()
  @IsString()
  serverPhoneNumber: string

  @IsNotEmpty()
  @IsString()
  defaultDataStreamId: string

  @IsNotEmpty()
  @IsString()
  iccid: string
}

export class CreateDeviceDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Device name',
    example: 'Example device'
  })
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  lat?: string

  @IsNumber()
  @IsOptional()
  lng?: string

  @IsNumber()
  @IsOptional()
  alt?: string

  @IsString()
  @IsOptional()
  type?: string

  @IsBoolean()
  @IsOptional()
  connected?: boolean

  @IsPositive()
  @IsOptional()
  price?: number
}

export interface EditDeviceDto {
  [key: string]: string | number | boolean | null
}

export class DeviceMessageDto {
  @IsString()
  timestamp: string

  @IsString()
  payload: string

  @IsString()
  source: string
}

export class DeviceCommandDto {
  @IsString()
  keyOwnerAddress: string

  @IsString()
  keyAssetId: string
}

export class Device {
  @ApiProperty({ description: 'SmartKey address', example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud' })
  address: string

  @ApiProperty({
    description: 'AES encrypted waves backup phrase. Refer to the README for details.',
    example: 'U2FsdGVkX1+UHPgmbS60YfwtbnEB+h6y9Q9VoR1aqB+GYBB7LQW7Jxruasw6STPih3yk2/Ty79KMcp4SllG3b00P0IR/jpuyzTw1wQ5UHNCYk7YpqAuwwyxArlgWQP/IFdZkBWpJtVJ0PQ8ln8Odso5TlBhvEljxsRlGMe4uKks='
  })
  encryptedSeed: string
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
