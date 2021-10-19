import { Module } from '@nestjs/common'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [BlockchainModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
