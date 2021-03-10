import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { BlockchainModule } from './blockchain/blockchain.module'
import { AuthModule } from './auth/auth.module'
import { DevicesModule } from './devices/devices.module'
import { UsersModule } from './users/users.module'
import { KeysModule } from './keys/keys.module'
import { UtilsModule } from './utils/utils.module'
import { MorganInterceptor, MorganModule } from 'nest-morgan'
import { APP_INTERCEPTOR } from '@nestjs/core'
import config from './config'
import { LoggerMiddleware } from './Logger'

const logsModule = config().logs ? [MorganModule.forRoot()] : []
const logsProvider = config().logs
  ? [
      {
        provide: APP_INTERCEPTOR,
        useClass: MorganInterceptor('dev')
      }
    ]
  : []

@Module({
  imports: [
    ...logsModule,
    DevicesModule,
    BlockchainModule,
    AuthModule,
    UsersModule,
    KeysModule,
    UtilsModule
  ],
  providers: [...logsProvider],
  controllers: []
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
