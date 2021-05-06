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

  @ApiProperty({ example: 'Not found' })
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
  @ApiProperty({ example: 400, description: 'HTTP response code' })
  statusCode: number

  @ApiProperty({ example: ['custom error message'], description: 'Error message(s)' })
  message: string[]

  @ApiProperty({ example: 'Bad request' })
  error: string
}

export class BlockchainAddress {
  @ApiProperty({
    description: 'SmartKey address',
    example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
  })
  address: string

  @ApiProperty({
    description: 'AES encrypted backup phrase. Refer to the README for details.',
    example:
      'U2FsdGVkX1+UHPgmbS60YfwtbnEB+h6y9Q9VoR1aqB+GYBB7LQW7Jxruasw6STPih3yk2/Ty79KMcp4SllG3b00P0IR/jpuyzTw1wQ5UHNCYk7YpqAuwwyxArlgWQP/IFdZkBWpJtVJ0PQ8ln8Odso5TlBhvEljxsRlGMe4uKks='
  })
  encryptedSeed: string
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
