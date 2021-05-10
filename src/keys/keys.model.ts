import { IsNotEmpty, IsInt, IsString, IsPositive, Max, IsArray, ValidateNested, IsOptional } from 'class-validator'
import { IsAddress } from '../validators'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export interface CreateKeyResult {
  assetId?: string
  transferTx?: string
  dataTx?: string
  success: boolean
  error?: string
}

export class CreateKeyResultResponse implements CreateKeyResult {
  @ApiProperty({
    description: 'Key Asset ID',
    example: '7HbEUg9yWMGtJ9dNW24rvcseiPYXAAaCoe23StkcyWXS',
    required: false
  })
  assetId?: string

  @ApiProperty({
    description: 'Transfer transaction hash',
    example: '7HbEUg9yWMGtJ9dNW24rvcseiPYXAAaCoe23StkcyWXS',
    required: false
  })
  transferTx?: string

  @ApiProperty({
    description: 'Data transaction hash',
    example: '7HbEUg9yWMGtJ9dNW24rvcseiPYXAAaCoe23StkcyWXS',
    required: false
  })
  dataTx?: string

  @ApiProperty({
    description: 'status',
    example: true
  })
  success: boolean
}

export class CreateKeyResultResponseWithError extends CreateKeyResultResponse {
  @ApiProperty({
    description: 'status',
    example: false
  })
  success: boolean

  @ApiProperty({
    description: 'Error message',
    example: 'Something went wrong',
    required: false
  })
  error?: string
}

export class CreateAndTransferKeyDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  @ApiProperty({
    description: 'Device Address',
    example: '3M2TC9skx4CuV2pwfCHwxDY9JPAAGA9sNkt'
  })
  device: string

  @IsNotEmpty()
  @IsString()
  @IsAddress
  @ApiProperty({
    description: 'User Address',
    example: '3M2TC9skx4CuV2pwfCHwxDY9JPAAGA9sNkt'
  })
  user: string

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'Key expiration date',
    example: 1619180438000
  })
  validTo: number

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: 'Amount of keys',
    example: 1
  })
  amount: number
}

export class Key {
  @ApiProperty({
    description: 'ID of key',
    example: '9kY6qhKMRs4jHBPTHV1Pgdzqbo3X4XmBM7koAxwR9RTf'
  })
  assetId: string

  @ApiProperty({
    description: 'Address of issuer',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  issuer: string

  @ApiProperty({
    description: 'Address of device',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  device: string

  @ApiProperty({
    description: 'Time of issue in Epoch timestamp',
    example: 1592861516794
  })
  issueTimestamp: number

  @ApiProperty({
    description: 'Time of expiration in Epoch timestamp',
    example: 1592861516794
  })
  validTo: number
}

export class CreateKeyRequestsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKeyRequestDto)
  requests: CreateKeyRequestDto[]
}

export class CreateKeyRequestDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  @ApiProperty({
    description: 'Device Address',
    example: '3M2TC9skx4CuV2pwfCHwxDY9JPAAGA9sNkt'
  })
  device: string

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Max(Number.MAX_SAFE_INTEGER)
  @ApiProperty({
    description: 'Key expiration date in Epoch miliseconds',
    example: 1619180438000
  })
  validTo: number

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Max(80) // max amount of items in list for ride script
  @ApiProperty({
    description: 'Amount of keys - max 80',
    example: 10
  })
  amount: number
}

export class CreateKeyDto extends CreateKeyRequestDto {
  @IsOptional()
  @IsString()
  @IsAddress
  @ApiProperty({
    description: 'Recipient Address',
    example: '3M2TC9skx4CuV2pwfCHwxDY9JPAAGA9sNkt',
    required: false
  })
  recipient?: string
}
