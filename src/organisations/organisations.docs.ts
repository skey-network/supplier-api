import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import {
  ApiFilledCustomErrorResponse,
  ApiFilledNotFoundResponse,
  ApiFilledUnauthorizedResponse
} from '../common/responses.swagger'

export const RemoveKeyProperties = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove key',
      description: 'Burn key on organisation address and remove from device'
    }),
    ApiBearerAuth(),
    ApiFilledUnauthorizedResponse(),
    ApiFilledCustomErrorResponse(),
    ApiFilledNotFoundResponse(),
    ApiResponse({
      status: 200,
      description: 'Key removed successfully',
      schema: {
        type: 'object',
        properties: {
          txHashes: {
            type: 'array',
            example: [
              '6fE2qRiZrEAEgfU4b12VkLb8UGB9VpM7N4NncNAXoBYP',
              '6fE2qRiZrEAEgfU4b12VkLb8UGB9VpM7N4NncNAXoBYP'
            ]
          }
        }
      }
    }),
    ApiParam({
      name: 'organisation',
      description: 'Address of organisation',
      example: '3NAyyezdeXvgEwe1qVe3HXpUZBkEgwMEgud'
    }),
    ApiParam({
      name: 'key',
      description: 'Key asset id',
      example: '6fE2qRiZrEAEgfU4b12VkLb8UGB9VpM7N4NncNAXoBYP'
    })
  )
}
