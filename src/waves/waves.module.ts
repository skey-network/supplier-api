import { Module } from '@nestjs/common'
import { WavesReadService } from './waves.read.service'
import { WavesWriteService } from './waves.write.service'
import { WavesCompilerService } from './waves.compiler.service'

@Module({
  providers: [WavesReadService, WavesWriteService, WavesCompilerService],
  exports: [WavesReadService, WavesWriteService, WavesCompilerService]
})
export class WavesModule {}
