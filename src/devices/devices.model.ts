import { IsNotEmpty, IsString } from 'class-validator'

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

export interface EditDeviceDto {
  [key: string]: string | number | boolean | null
}
