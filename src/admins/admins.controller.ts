import {
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  OnApplicationBootstrap,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common'
import { AdminGuard } from '../auth/admin.guard'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { EntityNotFoundError, QueryFailedError } from 'typeorm'
import { CreateAdminDto, UpdateAdminDto } from './admins.model'
import { AdminsService } from './admins.service'
import config from '../config'
import { Logger } from '../logger/Logger.service'

@Controller('admins')
@UseGuards(AdminGuard)
@UseGuards(JwtAuthGuard)
@Catch(QueryFailedError, EntityNotFoundError)
export class AdminsController implements OnApplicationBootstrap {
  constructor(private adminsService: AdminsService) {}

  private readonly logger = new Logger(AdminsController.name)

  @Get()
  async findAll() {
    return await this.adminsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.adminsService.findOne(id)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.adminsService.remove(id)
  }

  @Post()
  async create(@Body() createAdminDto: CreateAdminDto) {
    return await this.adminsService.create(createAdminDto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return await this.adminsService.update(id, updateAdminDto)
  }

  async onApplicationBootstrap() {
    // create admin user if doesnt exist

    const { email, password } = config().admin
    const exists = await this.adminsService.findByEmail(email)
    if (exists) return

    const result = await this.adminsService.create({
      email,
      password,
      role: 'admin'
    })

    if (result) {
      const message = `Created admin user with credentials: ${email} ${password}`
      this.logger.log(Array(message.length).fill('=').join(''))
      this.logger.log(message)
      this.logger.log(Array(message.length).fill('=').join(''))
    } else {
      this.logger.error('Cannot create admin user')
    }
  }
}
