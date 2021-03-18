import { Module } from '@nestjs/common'
import { SupplierModule } from '../supplier/supplier.module'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { KeysController } from './keys.controller'
import { KeysService } from './keys.service'

@Module({
  imports: [BlockchainModule, SupplierModule],
  controllers: [KeysController],
  providers: [KeysService]
})
export class KeysModule {}
