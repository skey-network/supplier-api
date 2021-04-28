import {
  ApiProperty,
  ApiResponse,
  ApiResponseOptions,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse
} from '@nestjs/swagger'

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

export class TransactionResponse {
  @ApiProperty({
    description: 'Transaction hash',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  txHash: string
}

export class AssetTransactionResponse extends TransactionResponse {
  @ApiProperty({
    description: 'Asset ID',
    example: '7HbEUg9yWMGtJ9dNW24rvcseiPYXAAaCoe23StkcyWXS'
  })
  assetId: string
}

export class CustomErrorMessage {
  @ApiProperty({ example: 'custom error message' })
  message: string

  @ApiProperty({ example: "{ 'status': 409 }" })
  details: string
}

export const ApiFilledUnauthorizedResponse = (options: ApiResponseOptions = {}) =>
  ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: UnauthorizedResponse,
    ...options
  })

export const ApiFilledForbiddenResponse = (options: ApiResponseOptions = {}) =>
  ApiForbiddenResponse({
    description: 'User role must be admin',
    type: ForbiddenResponse,
    ...options
  })

export const ApiFilledNotFoundResponse = (options: ApiResponseOptions = {}) =>
  ApiNotFoundResponse({
    description: 'Item not found',
    type: NotFoundResponse,
    ...options
  })

export const ApiFilledCustomErrorResponse = (options: ApiResponseOptions = {}) =>
  ApiResponse({
    status: 400,
    description: 'Custom error messsage',
    type: CustomErrorMessage,
    ...options
  })
