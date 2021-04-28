import { ApiProperty } from '@nestjs/swagger'

export class AuthResponse {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6eyJ1c2VybmFtZSI6ImFkbWluIn0sImlhdCI6MTYxMTc1MjI4NCwiZXhwIjoxNjExODM4Njg0fQ.WWILuDGagf382Xx9Jiaur0qnVM4LI0jei_z2Q-BlQjY',
    description: 'JWT Token'
  })
  access_token: string
}

export class QueryParams {
  @ApiProperty({
    example: 'test@example.com',
    description: 'User email'
  })
  email: string

  @ApiProperty({
    example: 'foobar',
    description: 'User password'
  })
  password: string
}
