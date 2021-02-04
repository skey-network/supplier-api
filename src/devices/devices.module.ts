import { Module } from '@nestjs/common'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { OrangeModule } from '../orange/orange.module'
import { WavesModule } from '../waves/waves.module'

@Module({
  imports: [OrangeModule, WavesModule],
  controllers: [DevicesController],
  providers: [DevicesService]
})
export class DevicesModule {}
