import { Controller, Param, Post, UseGuards } from '@nestjs/common'
import { AddressValidationPipe } from '../validators'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import config from '../config'
import { AppsService } from './apps.service'

@UseGuards(JwtAuthGuard)
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Post(`${config().apps.rbb.address}/open/:device`)
  async rbbOpen(@Param('device', AddressValidationPipe) device: string) {
    return await this.appsService.rbbOpen(device)
  }
}
