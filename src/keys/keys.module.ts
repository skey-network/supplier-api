import { Module } from '@nestjs/common'
import { WavesModule } from '../waves/waves.module'
import { KeysController } from './keys.controller'
import { KeysService } from './keys.service'

@Module({
  imports: [WavesModule],
  controllers: [KeysController],
  providers: [KeysService]
})
export class KeysModule {}
