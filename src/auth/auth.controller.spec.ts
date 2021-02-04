import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LocalStrategy } from './local.strategy'
import { JwtSrategy } from './jwt.strategy'
import { JwtModule } from '@nestjs/jwt'
import config from '../config'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: config().jwt.secret,
          signOptions: { expiresIn: config().jwt.validTime }
        })
      ],
      providers: [AuthService, LocalStrategy, JwtSrategy],
      controllers: [AuthController]
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  // I DUNNO ....

  // describe('valid credentials', () => {
  //   it('should return access token', async () => {
  //     const res = await controller.login({
  //       username: process.env.ADMIN_USERNAME,
  //       password: process.env.ADMIN_PASSWORD
  //     })
  //     const token = res.access_token
  //     expect(token).toBeDefined()
  //     expect(typeof token).toBe('string')
  //   })
  // })

  // describe('invalid credentials', () => {
  //   it('should return access token', async () => {
  //     const res = await controller.login({
  //       username: 'aaaaaaaaaaaaaaaa',
  //       password: 'uuuuuuuuuuuuuuuu'
  //     })
  //     const token = res.access_token
  //     expect(token).toBeDefined()
  //     expect(token.length).toBeGreaterThan(1)
  //   })
  // })
})
