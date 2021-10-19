import { IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Public user name',
    example: 'RBB'
  })
  name?: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Public user description',
    example: 'RBB description'
  })
  description?: string
}

export class User {
  @ApiProperty({
    description: "Users' address in the blockchain",
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  address: string

  @ApiProperty({
    description: 'User name',
    example: 'Public user'
  })
  name: string

  @ApiProperty({
    description: 'User description',
    example: 'Lorem Ipsum dolor sit amet'
  })
  description: string

  @ApiProperty({
    description: 'Balance on the account',
    example: 200000000
  })
  balance: number
}
