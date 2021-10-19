import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AdminsService } from '../admins/admins.service'
import { compare } from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminsService: AdminsService
  ) {}

  async validateUser(email: string, password: string) {
    const admin = await this.adminsService.findByEmail(email)
    if (!admin) return null

    const validPassword = await compare(password, admin.passwordHash)
    if (!validPassword) return null

    return email
  }

  async login(email: string) {
    return { access_token: this.jwtService.sign({ email }) }
  }
}
