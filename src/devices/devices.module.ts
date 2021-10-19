import { Module } from '@nestjs/common'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { SupplierModule } from '../supplier/supplier.module'
import { DevicesCommandService } from './command.service'

@Module({
  imports: [BlockchainModule, SupplierModule],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesCommandService]
})
export class DevicesModule {}
