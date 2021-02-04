import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { LocalStrategy } from './local.strategy'
import { JwtSrategy } from './jwt.strategy'
import { JwtModule } from '@nestjs/jwt'
import config from '../config'

@Module({
  imports: [
    JwtModule.register({
      secret: config().jwt.secret,
      signOptions: { expiresIn: config().jwt.validTime }
    })
  ],
  providers: [AuthService, LocalStrategy, JwtSrategy],
  controllers: [AuthController]
})
export class AuthModule {}
