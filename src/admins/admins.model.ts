import {
  IsString,
  IsEmail,
  IsIn,
  MinLength,
  MaxLength,
  IsOptional
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateAdminDto {
  @IsEmail()
  @ApiProperty({ description: 'Admins e-mail address', example: 'test@example.com' })
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @ApiProperty({ description: 'Admins password - length between 8-32 characters', example: 'foobarbaz' })
  password: string

  @IsIn(['admin', 'editor'])
  @ApiProperty({ description: 'Admins role', enum: ['admin', 'editor'], example: 'admin' })
  role: 'admin' | 'editor'
}

export class UpdateAdminDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({ description: 'Admins e-mail address', example: 'test@example.com', required: false })
  email?: string

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @IsOptional()
  @ApiProperty({ description: 'Admins password - length between 8-32 characters', example: 'foobarbaz', required: false })
  password?: string

  @IsIn(['admin', 'editor'])
  @IsOptional()
  @ApiProperty({ description: 'Admins role', enum: ['admin', 'editor'], example: 'admin', required: false })
  role?: 'admin' | 'role'
}
