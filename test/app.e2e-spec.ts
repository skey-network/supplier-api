import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import config from '../src/config'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('app e2e', () => {
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>

  const ctx = {
    token: '',
    device: '',
    user: '',
    key: ''
  }

  const randomString = () => {
    return(Math.random().toString(36).substring(6))
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())
  })

  it('POST /auth/login', async () => {
    const res = await req()
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      .expect(201)
    ctx.token = res.body.access_token
  })

  it('POST /utils/setup', async () => {
    await req()
      .post('/utils/setup')
      .send({
        setScript: true,
        name: 'test name',
        description: 'test description',
        alias: 'test_' + randomString()
      })
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(201)
  })

  it('POST /devices', async () => {
    const res = await req()
      .post('/devices')
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(201)
    ctx.device = res.body.address
  })

  it('GET /devices/:address', async () => {
    await req()
      .get(`/devices/${ctx.device}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)
  })

  it('GET /devices', async () => {
    const res = await req()
      .get('/devices')
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)
    expect(res.body.includes(ctx.device)).toBeTruthy
  })

  it('POST /users', async () => {
    const res = await req()
      .post('/users')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ name: 'Adam', description: 'Maciek' })
      .expect(201)
    ctx.user = res.body.address
  })

  it('GET /users/:address', async () => {
    await req()
      .get(`/users/${ctx.user}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)
  })

  it('POST /keys', async () => {
    const validTo = Date.now() + config().key.minDuration + 3600000

    const res = await req()
      .post('/keys')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({
        device: ctx.device,
        validTo,
        amount: 1,
        recipient: config().blockchain.dappAddress
      })
      .expect(201)
    ctx.key = res.body[0].assetId
  })

  it('GET /keys/:assetId', async () => {
    await req()
      .get(`/keys/${ctx.key}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)
  })

  it('GET /keys', async () => {
    await req().get('/keys').set('Authorization', `Bearer ${ctx.token}`).expect(200)
  })

  it('PUT /keys/:assetId/transfer/:address', async () => {
    await req()
      .put(`/keys/${ctx.key}/transfer/${ctx.user}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)
  })

  it('DELETE /devices/:address', async () => {
    await req()
      .delete(`/devices/${ctx.device}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)
  })
})
