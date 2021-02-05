import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

const randomAddress = () => {
  const { chainId } = config().waves
  return Crypto.address(Crypto.randomSeed(), chainId)
}

describe('utils controller', () => {
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

  describe('POST /utils/faucet', () => {
    const address = randomAddress()
    const amount = 0.1 * 10 ** 8

    it('valid request', async () => {
      const res = await req()
        .post('/utils/faucet')
        .send({ address, amount })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(typeof res.body.txHash).toBe('string')
    })

    it('unauthorized', async () => {
      await req().post('/utils/faucet').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/utils/faucet')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('empty request', async () => {
      await req()
        .post('/utils/faucet')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    it('invalid data', async () => {
      const res = await req()
        .post('/utils/faucet')
        .send({ address: 'hello', amount: -54.2 })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      const { message } = res.body

      expect(message.includes('address must be valid waves address')).toBe(true)
      expect(message.includes('amount must be a positive number')).toBe(true)
      expect(message.includes('amount must be an integer number')).toBe(true)
    })
  })

  describe('POST /utils/setup', () => {
    it('valid request', async () => {
      const res = await req()
        .post('/utils/setup')
        .send({
          setScript: true,
          name: 'dApp',
          description: 'General Kenobi'
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(3)
      expect(typeof res.body[0].action).toBe('string')
      expect(typeof res.body[0].txHash).toBe('string')
    })

    it('unauthorized', async () => {
      await req().post('/utils/setup').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/utils/setup')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('empty request', async () => {
      await req()
        .post('/utils/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
    })
  })
})
