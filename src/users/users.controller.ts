import { Controller, Get, Param, Post, UseGuards, Body } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AddressValidationPipe } from '../validators'
import { UsersService } from './users.service'
import { CreateUserDto } from './users.model'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto)
  }

  @Get(':address')
  async show(@Param('address', AddressValidationPipe) address: string) {
    return await this.usersService.show(address)
  }
}
