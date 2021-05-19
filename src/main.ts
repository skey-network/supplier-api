import { config as configure } from 'dotenv'
configure()

import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { LoggerInterceptor } from './logger/logger.interceptor'
import config from './config'
// import { logLevels } from './logger/logger.config'
import { Logger } from './logger/Logger.service'
import { LoggerExceptionFilter } from './logger/logger.filter'
import * as fs from 'fs'

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger()
  })

  const { httpAdapter } = app.get(HttpAdapterHost)

  app.useGlobalPipes(new ValidationPipe({ disableErrorMessages: false }))
  app.useGlobalInterceptors(new LoggerInterceptor())
  app.useGlobalFilters(new LoggerExceptionFilter(httpAdapter))

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Supplier API')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build()
  )

  SwaggerModule.setup('api_docs', app, document, {
    swaggerOptions: { persistAuthorization: true }
  })

  fs.writeFileSync('./assets/docs.json', JSON.stringify(document))

  const logger = new Logger('NestApplication')

  await app.listen(config().port, () => {
    logger.log(`Server running on port ${config().port} ...`)
  })
}

bootstrap()
