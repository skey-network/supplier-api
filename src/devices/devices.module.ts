import { Module } from '@nestjs/common'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { SupplierModule } from '../supplier/supplier.module'
import { WavesModule } from '../waves/waves.module'

@Module({
  imports: [SupplierModule, WavesModule],
  controllers: [DevicesController],
  providers: [DevicesService]
})
export class DevicesModule {}
