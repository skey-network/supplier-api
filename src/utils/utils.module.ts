import { Module } from '@nestjs/common'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { UtilsController } from './utils.controller'
import { UtilsService } from './utils.service'

@Module({
  imports: [BlockchainModule],
  controllers: [UtilsController],
  providers: [UtilsService]
})
export class UtilsModule {}
