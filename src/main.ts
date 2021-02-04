import { config } from 'dotenv'
config()

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
// import { readFileSync } from 'fs'
import { ValidationPipe } from '@nestjs/common'

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())

  const config = new DocumentBuilder()
    .setTitle('SmartKey API')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  // const document = JSON.parse(readFileSync('./assets/docs.json').toString())
  SwaggerModule.setup('api_docs', app, document)

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
