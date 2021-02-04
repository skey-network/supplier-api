import { Module } from '@nestjs/common'
import { WavesModule } from '../waves/waves.module'
import { UtilsController } from './utils.controller'
import { UtilsService } from './utils.service'

@Module({
  imports: [WavesModule],
  controllers: [UtilsController],
  providers: [UtilsService]
})
export class UtilsModule {}
