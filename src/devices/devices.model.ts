import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsPositive,
  IsNumber
} from 'class-validator'

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
