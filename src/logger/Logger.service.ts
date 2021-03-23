import { Logger as StandardLogger } from '@nestjs/common'
import { appendFileSync } from 'fs'
import config from '../config'

export class Logger extends StandardLogger {
  private filePath = './logs.txt'
  private logLevel = config().logLevel

  log(message: string) {
    if (this.logLevel === 'none') return

    this.writeToFile(message)
    super.log(message)
  }

  warn(message: string) {
    if (this.logLevel === 'none') return

    this.writeToFile(message)
    super.warn(message)
  }

  error(message: string) {
    if (this.logLevel === 'none') return

    this.writeToFile(message)
    super.error(message)
  }

  debug(message: string) {
    if (this.logLevel !== 'debug') return

    this.writeToFile(message)
    super.debug(message)
  }

  private writeToFile(message: string) {
    appendFileSync(this.filePath, `${new Date().toISOString()} ${message}\n`)
  }
}
