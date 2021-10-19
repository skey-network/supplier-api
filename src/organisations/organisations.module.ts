import { Module } from '@nestjs/common'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { OrganisationsController } from './organisations.controller'
import { OrganisationsService } from './organisations.service'

@Module({
  imports: [BlockchainModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsService]
})
export class OrganisationsModule {}
