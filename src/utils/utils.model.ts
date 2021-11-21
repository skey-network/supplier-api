import { IsAddress } from '../validators'
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsPositive,
  IsInt,
  Matches
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FaucetDto {
  @IsNotEmpty()
  @IsString()
  @IsAddress
  @ApiProperty({
    description: 'Address to transfer funds to',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  address: string

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: 'Amount of funds to transfer',
    example: 5000000
  })
  amount: number
}

export class SetupDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Flag to set script or not',
    example: true,
    required: false
  })
  setScript?: boolean

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Public name of the dApp',
    example: 'RBB',
    required: false
  })
  name?: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Public description of the dApp',
    example: 'RBB Description',
    required: false
  })
  description?: string

  @IsOptional()
  @IsString()
  @Matches(/[a-z0-9\.\-\@\_]{4,30}/)
  @ApiProperty({
    description: 'Alias of the dApp on the blockchain.',
    example: 'dapp_rbb',
    required: false
  })
  alias?: string
}

export interface SetupAction {
  action: string
  txHash: string
}

export interface DataEntry {
  key: string
  value: string
}

export class SetupActionResponse implements SetupAction {
  @ApiProperty({
    description: 'Name of the aciton',
    example: 'setScript'
  })
  action: string

  @ApiProperty({
    description: 'Hash of the transaction',
    example: 'F62XWdbizUTrEM6g8fukKb1z31SoMg6Pcv1dbJjxGXHj'
  })
  txHash: string
}

export interface StatusResponse {
  address: string
  script: boolean
  name: string
  description: string
  nodeUrl: string
  chainId: string
}

export class Status implements StatusResponse {
  @ApiProperty({
    description: 'Address of the dApp',
    example: '3M2TC9skx4CuV2pwfCHwxDY9JPAAGA9sNkt'
  })
  address: string

  @ApiProperty({
    description: 'Flag determining if a script was set',
    example: true
  })
  script: boolean

  @ApiProperty({
    description: 'Name of the dApp',
    example: 'dApp'
  })
  name: string

  @ApiProperty({
    description: 'Description of the dApp',
    example: 'Lorem Ipsum dolor sit amet'
  })
  description: string

  @ApiProperty({
    description: 'URL of the node',
    example: 'http://localhost:6869'
  })
  nodeUrl: string

  @ApiProperty({
    description: 'Chain ID',
    example: 'R'
  })
  chainId: string

  @ApiProperty({
    description: 'Aliases of the dApp',
    isArray: true,
    example: ['alias:R:foobar', 'alias:R:dapp@rbb']
  })
  aliases: string[]
}
