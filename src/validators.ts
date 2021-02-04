import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { Matches, isInt } from 'class-validator'

const addressRegex = /^[1-9A-HJ-NP-Za-km-z]{35}$/
const assetIdRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

class ValidationError extends BadRequestException {
  constructor(message: string) {
    super({
      statusCode: 400,
      message: [message],
      error: 'Bad Request'
    })
  }
}

export const IsAddress = Matches(addressRegex, {
  message: (args) => `${args.property} must be valid waves address`
})

export const IsAssetId = Matches(assetIdRegex, {
  message: (args) => `${args.property} must be valid waves assetId`
})

export class AddressValidationPipe extends ValidationPipe {
  async transform(value: string) {
    if (!addressRegex.test(value)) {
      throw new ValidationError('address is not valid')
    }

    return value
  }
}

export class AssetIdValidationPipe extends ValidationPipe {
  async transform(value: string) {
    if (!assetIdRegex.test(value)) {
      throw new ValidationError('assetId is not valid')
    }

    return value
  }
}

export class OptionalAssetIdValidationPipe extends ValidationPipe {
  async transform(value: string) {
    if (!value) return

    if (!assetIdRegex.test(value)) {
      throw new ValidationError('assetId is not valid')
    }

    return value
  }
}

export class LimitPipe extends ValidationPipe {
  async transform(value: string) {
    if (!value) return 50

    if (!isInt(parseInt(value))) {
      throw new ValidationError('limit should be an integer')
    }

    return parseInt(value)
  }
}
