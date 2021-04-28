import { ApiProperty } from '@nestjs/swagger'

export class UnauthorizedResponse {
  @ApiProperty({
    example: 401
  })
  statusCode: number

  @ApiProperty({ example: 'Unauthorized' })
  message: string
}

export class ForbiddenResponse {
  @ApiProperty({
    example: 403
  })
  statusCode: number

  @ApiProperty({ example: 'Forbidden' })
  message: string
}

export class NotFoundResponse {
  @ApiProperty({
    example: 404
  })
  statusCode: number

  @ApiProperty({ example: 'Item not found' })
  message: string
}

export class CustomErrorMessage {
  @ApiProperty({ example: "custom error message" })
  message: string

  @ApiProperty({ example: "{ 'status': 409 }" })
  details: string
}