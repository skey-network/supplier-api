import { Module } from '@nestjs/common'
import { BlockchainReadService } from './blockchain.read.service'
import { BlockchainWriteService } from './blockchain.write.service'
import { BlockchainCompilerService } from './blockchain.compiler.service'

@Module({
  providers: [
    BlockchainReadService,
    BlockchainWriteService,
    BlockchainCompilerService
  ],
  exports: [
    BlockchainReadService,
    BlockchainWriteService,
    BlockchainCompilerService
  ]
})
export class BlockchainModule {}
