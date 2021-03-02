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
import { AppsController } from './apps/apps.controller';
import { AppsService } from './apps/apps.service';
import { AppsModule } from './apps/apps.module';

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
    UtilsModule,
    AppsModule
  ],
  providers: [...logsProvider, AppsService],
  controllers: [AppsController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
