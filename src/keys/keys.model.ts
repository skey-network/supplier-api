import { IsNotEmpty, IsInt, IsString, IsPositive, Max } from 'class-validator'
import { IsAddress } from '../validators'

export class CreateKeyDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  recipient: string

  @IsNotEmpty()
  @IsString()
  @IsAddress
  device: string

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Max(Number.MAX_SAFE_INTEGER)
  validTo: number

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Max(80) // max amount of items in list for ride script
  amount: number
}

export interface CreateKeyResult {
  assetId?: string
  transferTx?: string
  dataTx?: string
  success: boolean
  error?: string
}

export class CreateAndTransferKeyDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  device: string

  @IsNotEmpty()
  @IsString()
  @IsAddress
  user: string

  @IsNotEmpty()
  @IsInt()
  validTo: number

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  amount: number
}
