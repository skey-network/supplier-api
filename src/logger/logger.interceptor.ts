import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger
} from '@nestjs/common'
import * as chalk from 'chalk'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private logger = new Logger(LoggerInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()

    this.logger.log(`${req.method} ${req.path}`)

    this.logger.debug(`Body ${JSON.stringify(req.body, null, 2)}`)
    this.logger.debug(`Query ${JSON.stringify(req.query, null, 2)}`)

    const time = Date.now()

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse()
        const executionTime = chalk.yellow(`+${Date.now() - time}ms`)
        this.logger.log(`Response status ${res.statusCode}, ${executionTime}`)
      })
    )
  }
}
