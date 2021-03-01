import { Module } from '@nestjs/common'
import { SupplierModule } from '../supplier/supplier.module'
import { WavesModule } from '../waves/waves.module'
import { KeysController } from './keys.controller'
import { KeysService } from './keys.service'

@Module({
  imports: [WavesModule, SupplierModule],
  controllers: [KeysController],
  providers: [KeysService]
})
export class KeysModule {}
