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

describe('keys controller', () => {
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>
  let token = ''

  const ctx = {
    device: '',
    user: ''
  }

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

  describe('prepare', () => {
    it('create device', async () => {
      const res = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)

      ctx.device = res.body.address
    })

    it('create user', async () => {
      const res = await req()
        .post('/users')
        .set('Authorization', `Bearer ${token}`)

      ctx.user = res.body.address
    })
  })

  describe('POST /keys', () => {
    it('valid request', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000
      const amount = config().key.maxAmount < 4 ? 1 : 4

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(amount)
      expect(typeof res.body[0].assetId).toBe('string')
    })

    it('invalid data', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: 'hello', validTo, amount: -42 })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body

      expect(message.includes('device must be valid waves address')).toBe(true)
      expect(message.includes('amount must be a positive number')).toBe(true)
    })

    it('invalid timestamp', async () => {
      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo: 1000, amount: 1 })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body
      expect(/validTo/.test(message[0])).toBe(true)
    })

    it('invalid amount', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000
      const amount = config().key.maxAmount + 1

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body
      const match = `amount cannot exceed ${config().key.maxAmount}`
      expect(message[0]).toBe(match)
    })

    it('unauthorized', async () => {
      await req().post('/keys').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/keys')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('GET /keys/:assetId', () => {
    let assetId = ''

    beforeAll(async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount: 1 })
        .set('Authorization', `Bearer ${token}`)

      assetId = res.body[0].assetId
    })

    it('valid request', async () => {
      const res = await req()
        .get(`/keys/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Object)
      expect(res.body.assetId).toBe(assetId)
      expect(res.body.issuer).toBe(config().waves.dappAddress)
      expect(res.body.issueTimestamp).toBeGreaterThanOrEqual(0)
      expect(res.body.device).toBe(ctx.device)
      expect(res.body.validTo).toBeGreaterThanOrEqual(res.body.issueTimestamp)
    })

    it('invalid assetId', async () => {
      const res = await req()
        .get('/keys/hello')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('assetId is not valid')).toBe(true)
    })

    it('unauthorized', async () => {
      await req().get(`/keys/${assetId}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get(`/keys/${assetId}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('GET /keys', () => {
    let assetId = ''

    beforeAll(async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount: 1 })
        .set('Authorization', `Bearer ${token}`)

      assetId = res.body[0].assetId
    })

    it('valid request', async () => {
      const res = await req()
        .get('/keys')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body[0].assetId).toBeDefined()
    })

    it('unauthorized', async () => {
      await req().get('/keys').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get('/keys')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })
})
