import { Module } from '@nestjs/common'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { AppsController } from './apps.controller'
import { AppsService } from './apps.service'

@Module({
  imports: [BlockchainModule],
  providers: [AppsService],
  controllers: [AppsController]
})
export class AppsModule {}
