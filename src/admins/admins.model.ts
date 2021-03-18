import {
  IsString,
  IsEmail,
  IsIn,
  MinLength,
  MaxLength,
  IsOptional
} from 'class-validator'

export class CreateAdminDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password: string

  @IsIn(['admin', 'editor'])
  role: 'admin' | 'editor'
}

export class UpdateAdminDto {
  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @IsOptional()
  password?: string

  @IsIn(['admin', 'editor'])
  @IsOptional()
  role?: 'admin' | 'role'
}
