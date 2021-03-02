import { Module } from '@nestjs/common'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { WavesModule } from '../waves/waves.module'

@Module({
  imports: [WavesModule],
  controllers: [DevicesController],
  providers: [DevicesService]
})
export class DevicesModule {}
