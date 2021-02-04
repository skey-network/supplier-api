import { IsAddress } from '../validators'
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional
} from 'class-validator'

export class FaucetDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  address: string

  @IsNotEmpty()
  @IsNumber()
  amount: number
}

export class SetupDto {
  @IsOptional()
  @IsBoolean()
  setScript?: boolean

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string
}

export interface SetupAction {
  action: string
  txHash: string
}
