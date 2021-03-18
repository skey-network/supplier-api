import { Controller, Post, Req, UseGuards } from '@nestjs/common'
import { LocalAuthGuard } from './local.guard'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req) {
    return this.authService.login(req.user)
  }
}
