import { Module } from '@nestjs/common'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { KeysController } from './keys.controller'
import { KeysService } from './keys.service'

@Module({
  imports: [BlockchainModule],
  controllers: [KeysController],
  providers: [KeysService]
})
export class KeysModule {}
