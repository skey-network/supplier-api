import { Module } from '@nestjs/common'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { SupplierModule } from '../supplier/supplier.module'

@Module({
  imports: [BlockchainModule, SupplierModule],
  controllers: [DevicesController],
  providers: [DevicesService]
})
export class DevicesModule {}
