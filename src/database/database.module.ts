import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import config from '../config'

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: config().db.path,
      key: config().db.key,
      busyErrorRetry: 100,
      autoLoadEntities: true,
      synchronize: true
    })
  ]
})
export class DatabaseModule {}
