import { NestMiddleware } from '@nestjs/common'
import * as chalk from 'chalk'
import { Request, Response, NextFunction } from 'express'
import config from './config'

const enableLogging = config().logs

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, _: Response, next: NextFunction) {
    Logger.log(JSON.stringify(req.body, null, 2))
    next()
  }
}

export class Logger {
  static log(message: any) {
    const prefix = chalk.bgBlue('LOG')
    Logger.write(`${prefix} ${message}`)
  }

  static warn(message: any) {
    const prefix = chalk.bgYellow('LOG')
    this.write(`${prefix} ${message}`)
  }

  static error(message: any) {
    const prefix = chalk.bgRed('LOG')
    this.write(`${prefix} ${message}`)
  }

  private static write(message: any) {
    if (enableLogging) console.log(message)
  }
}
