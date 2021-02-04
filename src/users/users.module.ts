import { Module } from '@nestjs/common'
import { WavesModule } from '../waves/waves.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [WavesModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
