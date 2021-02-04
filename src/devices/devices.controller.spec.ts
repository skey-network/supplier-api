import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import config from '../config'
import * as Crypto from '@waves/ts-lib-crypto'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('devices controller', () => {
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

  describe('POST /devices', () => {
    it('valid request', async () => {
      const res = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      const { address, seed } = res.body

      expect(typeof address).toBe('string')
      expect(typeof seed).toBe('string')
    })

    it('unauthorized', async () => {
      await req().post('/devices').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/devices')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('GET /devices', () => {
    beforeAll(async () => {
      await req().post('/devices').set('Authorization', `Bearer ${token}`)
    })

    it('valid request', async () => {
      const res = await req()
        .get('/devices')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
      expect(typeof res.body[0]).toBe('string')
    })

    it('unauthorized', async () => {
      await req().get('/devices').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get('/devices')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('GET /device/:address', () => {
    let device = ''

    beforeAll(async () => {
      const res = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
      device = res.body.address
    })

    it('valid request', async () => {
      const res = await req()
        .get(`/devices/${device}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Object)
      expect(res.body.ownerDapp).toBe(config().waves.dappAddress)
      expect(typeof res.body.address).toBe('string')
      expect(typeof res.body.balance).toBe('number')
      expect(res.body.balance).toBeGreaterThanOrEqual(0)
      expect(res.body.connected).toBe(false)
    })

    it('unauthorized', async () => {
      await req().get(`/devices/${device}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get(`/devices/${device}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid address', async () => {
      const res = await req()
        .get('/devices/hello')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })

    it('address not found', async () => {
      const fakeAddress = Crypto.address(Crypto.randomSeed())

      await req()
        .get(`/devices/${fakeAddress}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('DELETE /devices/:address', () => {
    let device = ''

    beforeAll(async () => {
      const res = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
      device = res.body.address
    })

    it('valid request', async () => {
      const res = await req()
        .delete(`/devices/${device}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Object)
      expect(typeof res.body.txHash).toBe('string')
    })

    it('device was deleted', async () => {
      await req()
        .get(`/devices/${device}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    it('unauthorized', async () => {
      await req().delete(`/devices/${device}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .delete(`/devices/${device}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid address', async () => {
      const res = await req()
        .delete('/devices/hello')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })

    it('address not found', async () => {
      const fakeAddress = Crypto.address(Crypto.randomSeed())

      await req()
        .delete(`/devices/${fakeAddress}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('GET /devices/:address/connection', () => {
    let device = ''

    beforeAll(async () => {
      const res = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
      device = res.body.address
    })

    it('unauthorized', async () => {
      await req().get(`/devices/${device}/connection`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get(`/devices/${device}/connection`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid address', async () => {
      const res = await req()
        .get('/devices/hello/connection')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })

    it('address not found', async () => {
      const fakeAddress = Crypto.address(Crypto.randomSeed())

      await req()
        .get(`/devices/${fakeAddress}/connection`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('POST /devices/:address/connect', () => {
    let device = ''

    const payload = {
      msisdn: '567567567',
      serverPhoneNumber: '346456456365',
      defaultDataStreamId: '592367456456456',
      iccid: '67343643564654'
    }

    beforeAll(async () => {
      const res = await req()
        .post('/devices')
        .send(payload)
        .set('Authorization', `Bearer ${token}`)
      device = res.body.address
    })

    it('unauthorized', async () => {
      await req().post(`/devices/${device}/connect`).send(payload).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post(`/devices/${device}/connect`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid address', async () => {
      const res = await req()
        .post('/devices/hello/connect')
        .send(payload)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })

    it('invalid data', async () => {
      const res = await req()
        .post('/devices/hello/connect')
        .send({})
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('msisdn must be a string')).toBe(true)
      expect(res.body.message.includes('msisdn should not be empty')).toBe(true)
      expect(
        res.body.message.includes('serverPhoneNumber must be a string')
      ).toBe(true)
      expect(
        res.body.message.includes('serverPhoneNumber should not be empty')
      ).toBe(true)
      expect(
        res.body.message.includes('defaultDataStreamId must be a string')
      ).toBe(true)
      expect(
        res.body.message.includes('defaultDataStreamId should not be empty')
      ).toBe(true)
      expect(res.body.message.includes('iccid must be a string')).toBe(true)
      expect(res.body.message.includes('iccid should not be empty')).toBe(true)
    })
  })

  describe('DELETE /devices/:address/disconnect', () => {
    let device = ''

    beforeAll(async () => {
      const res = await req()
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
      device = res.body.address
    })

    it('unauthorized', async () => {
      await req().delete(`/devices/${device}/disconnect`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .delete(`/devices/${device}/disconnect`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid address', async () => {
      const res = await req()
        .delete('/devices/hello/disconnect')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })

    it('address not found', async () => {
      const fakeAddress = Crypto.address(Crypto.randomSeed())

      await req()
        .delete(`/devices/${fakeAddress}/disconnect`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })
})