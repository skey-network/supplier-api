import { Module } from '@nestjs/common'
import { OrangeService } from './orange.service'

@Module({
  providers: [OrangeService],
  exports: [OrangeService]
})
export class OrangeModule {}
