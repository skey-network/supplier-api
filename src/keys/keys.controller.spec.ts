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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())

    const tokenRequest = await req().post('/auth/login').send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    })
    token = tokenRequest.body.access_token
  })

  describe('prepare', () => {
    it('create device', async () => {
      const res = await req().post('/devices').set('Authorization', `Bearer ${token}`)

      ctx.device = res.body.address
    })

    it('create user', async () => {
      const res = await req().post('/users').set('Authorization', `Bearer ${token}`)

      ctx.user = res.body.address
    })
  })

  describe('POST /keys', () => {
    it('valid request', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount: 4, recipient: ctx.user })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(4)
      expect(typeof res.body[0].assetId).toBe('string')
      expect(typeof res.body[0].transferTx).toBe('string')
      expect(typeof res.body[0].dataTx).toBe('string')
      expect(res.body[1].success).toBe(true)
    })

    it('invalid data', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: 'hello', validTo, amount: -42, recipient: ctx.user })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body

      expect(message.includes('device must be valid blockchain address')).toBe(true)
      expect(message.includes('amount must be a positive number')).toBe(true)
    })

    it('invalid timestamp', async () => {
      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo: 1000, amount: 1, recipient: ctx.user })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body

      expect(message.find((mes) => /validTo/.test(mes))).toBeDefined()
    })

    it('invalid amount', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount: 5000, recipient: ctx.user })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body
      expect(message.includes('amount must not be greater than 80')).toBe(true)
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

  describe('POST /keys/:recipient', () => {
    let secondDevice = ''

    beforeAll(async () => {
      const res = await req().post('/devices').set('Authorization', `Bearer ${token}`)
      secondDevice = res.body.address
    })

    describe('valid request', () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      it('valid request', async() => {
        const res = await req()
          .post('/keys/' + ctx.user)
          .send({ requests: [{ device: ctx.device, validTo, amount: 2 }]})
          .set('Authorization', `Bearer ${token}`)
          .expect(201)
      })

      it('valid requests for multiple devices', async () => {
        const res = await req()
          .post('/keys/' + ctx.user)
          .send({ requests: [{ device: ctx.device, validTo, amount: 2 }, { device: secondDevice, validTo, amount: 2 }]})
          .set('Authorization', `Bearer ${token}`)
          .expect(201)
      })
    })

    describe('invalid request', () => {
      it('unauthorized', async () => {
        await req().post('/keys' + ctx.user).expect(401)
      })
  
      it('invalid token', async () => {
        await req()
          .post('/keys' + ctx.user)
          .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
          .expect(401)
      })
    })
  })

  describe('GET /keys/:assetId', () => {
    let assetId = ''

    beforeAll(async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount: 1, recipient: ctx.user })
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
      expect(res.body.issuer).toBe(config().blockchain.dappAddress)
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
        .send({ device: ctx.device, validTo, amount: 1, recipient: ctx.user })
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

  describe('POST /keys/:assetId/transfer/:address', () => {
    let assetId = ''

    beforeAll(async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({
          device: ctx.device,
          validTo,
          amount: 1,
          recipient: config().blockchain.dappAddress
        })
        .set('Authorization', `Bearer ${token}`)

      assetId = res.body[0].assetId
    })

    it('valid request', async () => {
      const res = await req()
        .put(`/keys/${assetId}/transfer/${ctx.user}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(typeof res.body.txHash).toBe('string')
    })

    it('unauthorized', async () => {
      await req().put(`/keys/${assetId}/transfer/${ctx.user}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .put(`/keys/${assetId}/transfer/${ctx.user}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid assetId', async () => {
      const res = await req()
        .put(`/keys/hello/transfer/${ctx.user}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body
      expect(message[0]).toBe('assetId is not valid')
    })

    it('invalid address', async () => {
      const res = await req()
        .put(`/keys/${assetId}/transfer/there`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body
      expect(message[0]).toBe('address is not valid')
    })
  })

  // describe('POST /keys/generate_and_transfer', () => {
  // What to do with supplier api

  // it('valid request', async () => {
  //   const validTo = Date.now() + config().key.minDuration + 3_600_000
  //   const amount = 80 < 4 ? 1 : 4

  //   const res = await req()
  //     .post('/keys/generate_and_transfer')
  //     .send({ device: ctx.device, validTo, amount, user: ctx.user })
  //     .set('Authorization', `Bearer ${token}`)
  //     .expect(201)

  //   expect(res.body).toBeInstanceOf(Array)
  //   expect(res.body.length).toBe(amount)
  //   expect(typeof res.body[0].assetId).toBe('string')
  // })

  //   it('invalid data', async () => {
  //     const validTo = Date.now() + config().key.minDuration + 3_600_000

  //     const res = await req()
  //       .post('/keys/generate_and_transfer')
  //       .send({ device: 'hello', validTo, amount: -42 })
  //       .set('Authorization', `Bearer ${token}`)
  //       .expect(400)

  //     const { message } = res.body

  //     expect(message.includes('device must be valid blockchain address')).toBe(true)
  //     expect(message.includes('user must be valid blockchain address')).toBe(true)
  //     expect(message.includes('user must be a string')).toBe(true)
  //     expect(message.includes('user should not be empty')).toBe(true)
  //     expect(message.includes('amount must be a positive number')).toBe(true)
  //   })

  //   it('invalid timestamp', async () => {
  //     const res = await req()
  //       .post('/keys/generate_and_transfer')
  //       .send({ device: ctx.device, validTo: 1000, amount: 1, user: ctx.user })
  //       .set('Authorization', `Bearer ${token}`)
  //       .expect(400)

  //     const { message } = res.body
  //     expect(/validTo/.test(message[0])).toBe(true)
  //   })

  //   it('invalid amount', async () => {
  //     const validTo = Date.now() + config().key.minDuration + 3_600_000
  //     const amount = 80 + 1

  //     const res = await req()
  //       .post('/keys/generate_and_transfer')
  //       .send({ device: ctx.device, validTo, amount, user: ctx.user })
  //       .set('Authorization', `Bearer ${token}`)
  //       .expect(400)

  //     const { message } = res.body
  //     const match = `amount cannot exceed ${80}`
  //     expect(message[0]).toBe(match)
  //   })

  //   it('unauthorized', async () => {
  //     await req().post('/keys/generate_and_transfer').expect(401)
  //   })

  //   it('invalid token', async () => {
  //     await req()
  //       .post('/keys/generate_and_transfer')
  //       .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
  //       .expect(401)
  //   })
  // })

  describe('DELETE /keys/:assetId', () => {
    let assetId = ''

    beforeAll(async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({
          device: ctx.device,
          validTo,
          amount: 1,
          recipient: config().blockchain.dappAddress
        })
        .set('Authorization', `Bearer ${token}`)

      assetId = res.body[0].assetId
    })

    it('address not found', async () => {
      await req().delete(`/keys/${ctx.user}`).set('Authorization', `Bearer ${token}`)
    })

    it('valid request', async () => {
      const res = await req()
        .delete(`/keys/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(typeof res.body.txHash).toBe('string')
    })

    it('unauthorized', async () => {
      await req().delete(`/keys/${assetId}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .delete(`/keys/${assetId}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })
})
