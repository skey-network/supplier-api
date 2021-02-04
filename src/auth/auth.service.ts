import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import config from '../config'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  validateUser(username: string, password: string) {
    if (config().admin.username !== username) return null
    if (config().admin.password !== password) return null

    return { username }
  }

  async login(username: string) {
    return { access_token: this.jwtService.sign({ username }) }
  }
}
