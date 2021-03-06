import { Module } from '@nestjs/common'
import { BlockchainModule } from './blockchain/blockchain.module'
import { AuthModule } from './auth/auth.module'
import { DevicesModule } from './devices/devices.module'
import { UsersModule } from './users/users.module'
import { KeysModule } from './keys/keys.module'
import { UtilsModule } from './utils/utils.module'
import { DatabaseModule } from './database/database.module'
import { AdminsModule } from './admins/admins.module'
import { SupplierModule } from './supplier/supplier.module'
import { OrganisationsModule } from './organisations/organisations.module'

@Module({
  imports: [
    AdminsModule,
    AuthModule,
    BlockchainModule,
    DatabaseModule,
    DevicesModule,
    KeysModule,
    SupplierModule,
    UsersModule,
    UtilsModule,
    OrganisationsModule
  ]
})
export class AppModule {}
