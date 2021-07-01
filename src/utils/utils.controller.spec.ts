import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

const randomAddress = () => {
  const { chainId } = config().blockchain
  return Crypto.address(Crypto.randomSeed(), chainId)
}

const randomString = () => {
  return Math.random().toString(36).substring(10)
}

describe('utils controller', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>
  let token = ''
  let blockchainWriteService: BlockchainWriteService

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
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

  afterAll(async () => {
    await app.close()
    await moduleFixture.close()
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

      expect(message.includes('address must be valid blockchain address')).toBe(true)
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
          description: 'General Kenobi',
          alias: 'dapp_' + randomString()
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(4)
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
      await req().post('/utils/setup').set('Authorization', `Bearer ${token}`).expect(201)
    })
  })

  describe('GET /utils/status', () => {
    it('valid request', async () => {
      await req().get('/utils/status').set('Authorization', `Bearer ${token}`).expect(200)
    })

    it('valid returned data', async () => {
      const res = await req().get('/utils/status').set('Authorization', `Bearer ${token}`)

      const { address, script, name, description, nodeUrl, chainId, aliases } = res.body

      expect(address).toEqual(config().blockchain.dappAddress)
      expect(script).toEqual(true)
      expect(name).toEqual('dApp')
      expect(description).toEqual('General Kenobi')
      expect(nodeUrl).toEqual(config().blockchain.nodeUrl)
      expect(chainId).toEqual(config().blockchain.chainId)
      expect(aliases.length).toBeGreaterThan(0)
    })

    it('returns blank data if not present', async () => {
      blockchainWriteService = new BlockchainWriteService()

      await blockchainWriteService.insertData([
        { key: 'name', value: undefined },
        { key: 'description', value: undefined }
      ])

      const res = await req().get('/utils/status').set('Authorization', `Bearer ${token}`)

      const { name, description } = res.body

      expect(name).toEqual(undefined)
      expect(description).toEqual(undefined)
    })

    it('unauthorized', async () => {
      await req().get('/utils/status').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get('/utils/status')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })
})
