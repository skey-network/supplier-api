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
import { Admin } from './admins.entity'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger'
import {
  UnauthorizedResponse,
  ForbiddenResponse,
  NotFoundResponse,
  CustomErrorMessage
} from '../common/responses.swagger'

@Controller('admins')
@ApiTags('admins')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@UseGuards(JwtAuthGuard)
@Catch(QueryFailedError, EntityNotFoundError)
export class AdminsController implements OnApplicationBootstrap {
  constructor(private adminsService: AdminsService) {}

  private readonly logger = new Logger(AdminsController.name)

  @Get()
  @ApiOperation({ summary: 'Get all admins' })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedResponse })
  @ApiResponse({ status: 200, description: 'Returns admin info', type: 'array',  })
  async findAll() {
    return await this.adminsService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin by id' })
  @ApiForbiddenResponse({ description: 'User role must be admin', type: ForbiddenResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: UnauthorizedResponse })
  @ApiNotFoundResponse({ description: 'Item not found', type: NotFoundResponse })
  @ApiResponse({ status: 200, description: 'Returns admin info', type: Admin })
  async findOne(@Param('id') id: string) {
    return await this.adminsService.findOne(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete admin' })
  @ApiForbiddenResponse({ description: 'User role must be admin', type: ForbiddenResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: UnauthorizedResponse })
  @ApiNotFoundResponse({ description: 'Item not found', type: NotFoundResponse })
  @ApiResponse({ status: 200, description: 'Admin deleted'})
  async remove(@Param('id') id: string) {
    return await this.adminsService.remove(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create new admin' })
  @ApiForbiddenResponse({ description: 'User role must be admin', type: ForbiddenResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: UnauthorizedResponse })
  @ApiResponse({ status: 400, description: 'Custom error message', type: CustomErrorMessage })
  @ApiResponse({ status: 201, description: 'Admin created', type: Admin})
  async create(@Body() createAdminDto: CreateAdminDto) {
    return await this.adminsService.create(createAdminDto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing admin by id' })
  @ApiForbiddenResponse({ description: 'User role must be admin', type: ForbiddenResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: UnauthorizedResponse })
  @ApiResponse({ status: 400, description: 'Custom error message', type: CustomErrorMessage })
  @ApiResponse({ status: 201, description: 'Admin updated', type: Admin})
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
      const message = `Created admin user with credentials: ${email}`
      this.logger.log(Array(message.length).fill('=').join(''))
      this.logger.log(message)
      this.logger.log(Array(message.length).fill('=').join(''))
    } else {
      this.logger.error('Cannot create admin user')
    }
  }
}
