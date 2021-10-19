import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Admin } from './admins.entity'
import { AdminsController } from './admins.controller'
import { AdminsService } from './admins.service'

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  providers: [AdminsService],
  controllers: [AdminsController],
  exports: [AdminsService]
})
export class AdminsModule {}
