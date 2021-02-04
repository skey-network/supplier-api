import { IsNotEmpty, IsInt, IsString, IsPositive } from 'class-validator'
import { IsAddress } from '../validators'

export class CreateKeyDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  device: string

  @IsNotEmpty()
  @IsInt()
  validTo: number

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  amount: number
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
