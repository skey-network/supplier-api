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

describe('apps controller', () => {
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>
  let token = ''

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())

    const tokenRequest = await req().post('/auth/login').send({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    })
    token = tokenRequest.body.access_token
  })

  describe('POST /rbb_address/open/device', () => {
    it('valid request', async () => {
      const deviceRes = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)

      await req()
        .post('/keys/generate_and_transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 1,
          user: config().apps.rbb.address,
          device: deviceRes.body.address,
          validTo: 9999999999999999
        })

      const res = await req()
        .post(
          `/apps/${config().apps.rbb.address}/open/${deviceRes.body.address}`
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(typeof res.body.txHash).toBe('string')
    })

    it('no key found', async () => {
      const deviceRes = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)

      const res = await req()
        .post(
          `/apps/${config().apps.rbb.address}/open/${deviceRes.body.address}`
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(
        res.body.message.includes('no valid keys found for this device')
      ).toBe(true)
    })

    it('invalid address', async () => {
      const res = await req()
        .post(`/apps/${config().apps.rbb.address}/open/${'aaa'}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })

    it('unauthorized', async () => {
      await req()
        .post(`/apps/${config().apps.rbb.address}/open/${'aaa'}`)
        .expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post(`/apps/${config().apps.rbb.address}/open/${'aaa'}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })
})
