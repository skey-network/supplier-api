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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledForbiddenResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse
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

  //
  // -------------------------------------------------------
  // GET /admins
  // -------------------------------------------------------
  //

  @Get()
  @ApiOperation({ summary: 'Get all admins' })
  @ApiFilledForbiddenResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 200,
    description: 'Returns admin info',
    type: Admin,
    isArray: true
  })
  async findAll() {
    return await this.adminsService.findAll()
  }

  //
  // -------------------------------------------------------
  // GET /admins/:id
  // -------------------------------------------------------
  //

  @Get(':id')
  @ApiOperation({ summary: 'Get admin by id' })
  @ApiFilledForbiddenResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({ status: 200, description: 'Returns admin info', type: Admin })
  async findOne(@Param('id') id: string) {
    return await this.adminsService.findOne(id)
  }

  //
  // -------------------------------------------------------
  // DELETE /admins/:id
  // -------------------------------------------------------
  //

  @Delete(':id')
  @ApiOperation({ summary: 'Delete admin' })
  @ApiFilledForbiddenResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledNotFoundResponse()
  @ApiResponse({ status: 200, description: 'Admin deleted' })
  async remove(@Param('id') id: string) {
    return await this.adminsService.remove(id)
  }

  //
  // -------------------------------------------------------
  // POST /admins
  // -------------------------------------------------------
  //

  @Post()
  @ApiOperation({ summary: 'Create new admin' })
  @ApiFilledForbiddenResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({ status: 201, description: 'Admin created', type: Admin })
  async create(@Body() createAdminDto: CreateAdminDto) {
    return await this.adminsService.create(createAdminDto)
  }

  //
  // -------------------------------------------------------
  // PUT /admins/:id
  // -------------------------------------------------------
  //

  @Put(':id')
  @ApiOperation({ summary: 'Update existing admin by id' })
  @ApiFilledForbiddenResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiFilledCustomErrorResponse()
  @ApiResponse({ status: 201, description: 'Admin updated', type: Admin })
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
