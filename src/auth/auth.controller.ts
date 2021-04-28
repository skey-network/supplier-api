import { Controller, Post, Query, Req, UseGuards } from '@nestjs/common'
import { LocalAuthGuard } from './local.guard'
import { AuthService } from './auth.service'
import { AuthResponse, QueryParams } from './auth.entity.swagger'
import { ApiFilledUnauthorizedResponse } from '../common/responses.swagger'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in and get JWT token' })
  @ApiQuery({ type: QueryParams })
  @ApiFilledUnauthorizedResponse()
  @ApiResponse({ status: 200, description: 'User logged in', type: AuthResponse })
  @UseGuards(LocalAuthGuard)
  async login(@Req() req) {
    return this.authService.login(req.user)
  }
}
