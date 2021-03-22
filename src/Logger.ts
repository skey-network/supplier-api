import { Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger(LoggerMiddleware.name)

  use(req: Request, _: Response, next: NextFunction) {
    this.logger.log(`${req.method.toUpperCase()} ${req.path}`)
    this.logger.log(`BODY ${JSON.stringify(req.body, null, 2)}`)
    next()
  }
}
