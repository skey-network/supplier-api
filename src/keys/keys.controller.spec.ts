import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import config from '../config'
import * as util from 'util'
import { equals } from 'class-validator'

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

    const deviceRes = await req().post('/devices').set('Authorization', `Bearer ${token}`)
    ctx.device = deviceRes.body.address

    const userRes = await req().post('/users').set('Authorization', `Bearer ${token}`)
    ctx.user = userRes.body.address
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

    it('recipient is skipped', async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const res = await req()
        .post('/keys')
        .send({ device: ctx.device, validTo, amount: 4 })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(4)
      expect(typeof res.body[0].assetId).toBe('string')
      expect(typeof res.body[0].transferTx).toBe('undefined')
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

  describe('POST /keys/multi', () => {
    const validTo = Date.now() + config().key.minDuration + 3_600_000
    let secondDevice = ''

    const assertValidDeviceKey = (deviceKey) => {
      expect(deviceKey.assetId).toBeDefined()
      expect(deviceKey.transferTx).toBeDefined()
      expect(deviceKey.dataTx).toBeDefined()
      expect(deviceKey.success).toEqual(true)
    }

    beforeAll(async () => {
      const res = await req().post('/devices').set('Authorization', `Bearer ${token}`)
      secondDevice = res.body.address
    })

    describe('valid request', () => {
      it('valid request', async () => {
        const res = await req()
          .post('/keys/multi')
          .send({
            requests: [{ recipient: ctx.user, device: ctx.device, validTo, amount: 2 }]
          })
          .set('Authorization', `Bearer ${token}`)

        expect(res.status).toEqual(201)
        expect(res.body.length).toEqual(1)

        const deviceKeys = res.body[0]
        expect(deviceKeys.device).toEqual(ctx.device)
        expect(deviceKeys.keys.length).toEqual(2)
        deviceKeys.keys.map((deviceKey) => {
          assertValidDeviceKey(deviceKey)
        })
      })

      it('valid request for multiple devices', async () => {
        const res = await req()
          .post('/keys/multi')
          .send({
            requests: [
              { recipient: ctx.user, device: ctx.device, validTo, amount: 1 },
              { recipient: ctx.user, device: secondDevice, validTo, amount: 1 }
            ]
          })
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

        expect(res.status).toEqual(201)

        expect(
          res.body.map((deviceKeys) => {
            return deviceKeys.device
          })
        ).toEqual([ctx.device, secondDevice])

        res.body.map((deviceKeys) => {
          expect(deviceKeys.keys.length).toEqual(1)
          assertValidDeviceKey(deviceKeys.keys[0])
        })
      })

      it('valid request - multiple requests for a single device', async () => {
        const res = await req()
          .post('/keys/multi')
          .send({
            requests: [
              { recipient: ctx.user, device: ctx.device, validTo, amount: 1 },
              { recipient: ctx.user, device: ctx.device, validTo, amount: 1 }
            ]
          })
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

        expect(res.status).toEqual(201)
        expect(
          res.body.map((deviceKeys) => {
            return deviceKeys.device
          })
        ).toEqual([ctx.device, ctx.device])

        res.body.map((deviceKeys) => {
          expect(deviceKeys.keys.length).toEqual(1)
          assertValidDeviceKey(deviceKeys.keys[0])
        })
      })

      it('recipient is skipped', async () => {
        const res = await req()
          .post('/keys/multi')
          .send({ requests: [{ device: ctx.device, validTo, amount: 4 }] })
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

        expect(res.body).toBeInstanceOf(Array)
        expect(res.body.length).toBe(1)
        const keyResponse = res.body[0].keys[0]
        expect(typeof keyResponse.assetId).toBe('string')
        expect(typeof keyResponse.transferTx).toBe('undefined')
        expect(typeof keyResponse.dataTx).toBe('string')
        expect(res.body[0].keys[1].success).toBe(true)
      })
    })

    describe('invalid request', () => {
      it('unauthorized', async () => {
        await req().post('/keys/multi').expect(401)
      })

      it('invalid token', async () => {
        await req()
          .post('/keys/multi')
          .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
          .expect(401)
      })

      describe('device', () => {
        const testCases = [
          {
            toString: () => "is an empty string",
            device: ''
          },
          {
            toString: () => "not provided",
            device: null
          },
          {
            toString: () => "is invalid",
            device: "foobar"
          }
        ]

        it.each(testCases)("%s", async (testCase) => {
          await req()
          .post('/keys/multi')
          .send({ requests: [{ recipient: ctx.user, device: testCase.device, validTo, amount: 1 }] })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
        })
      })

      describe('amount', () => {
        const testCases = [
          {
            toString: () => "is negative",
            amount: -1
          },
          {
            toString: () => "equals 0",
            amount: 0
          },
          {
            toString: () => "exceeds the limit",
            amount: 101
          },
          {
            toString: () => "is null",
            amount: null
          },
          {
            toString: () => "is not a number",
            amount: "12"
          },
          {
            toString: () => "is undefined",
            amount: undefined
          }
        ]

        it.each(testCases)("%s", async (testCase) => {
          await req()
          .post('/keys/multi')
          .send({ requests: [{ recipient: ctx.user, device: ctx.device, validTo, amount: testCase.amount }] })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
        })
      })

      describe('validTo', () => {
        const testCases = [
          {
            toString: () => 'is in the past',
            invalidTo: Date.now() - 1_000
          },
          {
            toString: () => 'is not provided',
            invalidTo: null
          },
          {
            toString: () => 'is too late',
            invalidTo: Date.now() + config().key.minDuration - 1_000
          }
        ]

        it.each(testCases)('%s', async (testCase) => {
          await req()
            .post('/keys/multi')
            .send({
              requests: [
                {
                  recipient: ctx.user,
                  device: ctx.device,
                  validTo: testCase.invalidTo,
                  amount: 1
                }
              ]
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
        })
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
