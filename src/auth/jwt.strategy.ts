import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import config from '../config'
import { AdminsService } from '../admins/admins.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class JwtSrategy extends PassportStrategy(Strategy) {
  constructor(private adminsService: AdminsService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config().jwt.secret
    })
  }

  async validate(payload: { email: string }) {
    return await this.adminsService.findByEmail(payload.email)
  }
}
