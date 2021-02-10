import { config as configure } from 'dotenv'
configure()

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule } from '@nestjs/swagger'
import { readFileSync } from 'fs'
import { ValidationPipe } from '@nestjs/common'

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())

  const document = JSON.parse(readFileSync('./assets/docs.json').toString())
  SwaggerModule.setup('api_docs', app, document)

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server running on port ${process.env.PORT ?? 3000} ...`)
  })
}

bootstrap()
