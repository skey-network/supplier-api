import { Module } from '@nestjs/common'
import { WavesModule } from './waves/waves.module'
import { SupplierModule } from './supplier/supplier.module'
import { AuthModule } from './auth/auth.module'
import { DevicesModule } from './devices/devices.module'
import { UsersModule } from './users/users.module'
import { KeysModule } from './keys/keys.module'
import { UtilsModule } from './utils/utils.module'

@Module({
  imports: [
    DevicesModule,
    WavesModule,
    SupplierModule,
    AuthModule,
    UsersModule,
    KeysModule,
    UtilsModule
  ]
})
export class AppModule {}
