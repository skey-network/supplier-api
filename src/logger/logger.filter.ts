import { ArgumentsHost, Catch, Logger } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

@Catch()
export class LoggerExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(LoggerExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    this.logger.log(`Response status ${exception?.status}`)

    if (exception?.status === 400) {
      this.logger.debug(`Errors ${JSON.stringify(exception.response, null, 2)}`)
    }

    super.catch(exception, host)
  }
}
