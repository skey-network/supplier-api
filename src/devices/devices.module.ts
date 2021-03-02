import { Module } from '@nestjs/common'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { BlockchainModule } from '../blockchain/blockchain.module'

@Module({
  imports: [BlockchainModule],
  controllers: [DevicesController],
  providers: [DevicesService]
})
export class DevicesModule {}
