import { Controller, Get, Param, Post, UseGuards, Body } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { AddressValidationPipe } from '../validators'
import { UsersService } from './users.service'
import { CreateUserDto, User } from './users.model'

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger'
import {
  ApiFilledUnauthorizedResponse,
  ApiFilledForbiddenResponse,
  ApiFilledNotFoundResponse,
  ApiFilledCustomErrorResponse,
  BlockchainAddress
} from '../common/responses.swagger'

@UseGuards(JwtAuthGuard)
@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //
  // -------------------------------------------------------
  // POST /users
  // -------------------------------------------------------
  //

  @Post()
  @ApiOperation({
    summary: 'Add new user',
    description: 'Create new address, transfer funds and save in dApp storage'
  })
  @ApiBearerAuth()
  @ApiFilledCustomErrorResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: BlockchainAddress
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto)
  }

  //
  // -------------------------------------------------------
  // GET /users/:address
  // -------------------------------------------------------
  //

  @ApiOperation({
    summary: 'Get details of user',
    description: 'Fetch user data',
    deprecated: true
  })
  @ApiBearerAuth()
  @ApiFilledCustomErrorResponse()
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({ status: 200, description: 'User data fetched', type: User })
  @ApiParam({
    name: 'address',
    description: 'Blockchain address of user',
    example: '3NBRJyj3RVj5wqz2i3z5KHqg88JcZQ8sr5k'
  })
  @Get(':address')
  async show(@Param('address', AddressValidationPipe) address: string) {
    return await this.usersService.show(address)
  }
}
