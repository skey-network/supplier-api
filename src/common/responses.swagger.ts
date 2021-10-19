import {
  ApiProperty,
  ApiBody,
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

export const ApiValidateTransactionBody = () =>
  ApiBody({
    required: true,
    schema: {
      example: {
        type: 16,
        version: 1,
        senderPublicKey: '2pMQFrA5wh7Eh24zwwDXUZgbxCKhXBecmwvkabsVMUZG',
        dApp: '3MJ4QsJfxzp81RLVWzn3sY8WQ6PfXp38uCd',
        call: {
          args: [
            { type: 'string', value: 'R6NF7LuXKDrXS2jqvbMa4QAQFVvD89Z6e6TFjM2gHah' },
            { type: 'string', value: 'open' }
          ],
          function: 'deviceAction'
        },
        payment: [],
        fee: 500000,
        feeAssetId: null,
        timestamp: 1623417987075,
        proofs: [
          '2c5YUgyGo6yG4EQ5wGofP5jmFtVnm4wRYPHwRFuS5HFira4gxDNRvqViJn38A5XdTWLFy3Sef1URe6H1tcjt8W1r'
        ],
        id: '7g5m3wSUw6gck84fRPXZt7bDg3hhJxT4g3WxxeXY9pKM'
      }
    }
  })
