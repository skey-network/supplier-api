import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import config from '../config'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('auth controller', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())
  })

  afterAll(async () => {
    await app.close()
    await moduleFixture.close()
  })

  describe('POST /auth/login', () => {
    it('valid request', async () => {
      const credentials = config().admin
      const res = await req().post('/auth/login').send(credentials).expect(201)

      const token = res.body.access_token

      expect(typeof token).toBe('string')

      await req().get('/devices').set('Authorization', `Bearer ${token}`).expect(200)
    })

    it('invalid credentials', async () => {
      const credentials = {
        email: '363456435636',
        password: '546364536345'
      }
      await req().post('/auth/login').send(credentials).expect(401)
    })

    it('empty request', async () => {
      await req().post('/auth/login').expect(401)
    })
  })
})
