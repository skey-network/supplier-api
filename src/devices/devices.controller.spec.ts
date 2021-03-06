import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import config from '../config'
import * as Crypto from '@waves/ts-lib-crypto'
import { decrypt } from '../common/aes-encryption'
import fetchMock from 'jest-fetch-mock'
import { getInstance } from 'skey-lib'
import { invokeScript, transfer } from '@waves/waves-transactions'
import { createTestDevice } from '../common/spec-helpers'
import { WVS } from 'skey-lib/dist/src/write'

jest.setTimeout(3600000)

const SUPPLIER_URL = config().supplier.url
const DEVICE_NAME_PREFIX = 'urn:lo:nsid:blockchain:'
const BLOCKCHAIN_NODE_URL = config().blockchain.nodeUrl
const BLOCKCHAIN_CHAIN_ID = config().blockchain.chainId
const lib = getInstance({
  nodeUrl: BLOCKCHAIN_NODE_URL,
  chainId: BLOCKCHAIN_CHAIN_ID
})

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('devices controller', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>
  let token = ''

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

  describe('POST /devices/device_message', () => {
    let device = ''

    beforeAll(async () => {
      device = (await createTestDevice(req, token)).address
    })

    it('valid request', async () => {
      const payload = {
        timestamp: '',
        source: `urn:lo:nsid:blockchain:${device}`,
        payload: 'Lat:25.11 Lon:65.678'
      }

      const res = await req()
        .post('/devices/device_message')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201)

      expect(res.body.txHash).toBeDefined()
    })
  })

  describe('POST /devices', () => {
    it('valid request', async () => {
      const { address, encryptedSeed } = await createTestDevice(req, token)

      expect(typeof address).toBe('string')
      expect(typeof encryptedSeed).toBe('string')
    })

    it('seed is encrypted', async () => {
      const { encryptedSeed } = await createTestDevice(req, token)
      let seedRegex = /(?:[a-z]{3,}\s){14}[a-z]{3,}/
      expect(encryptedSeed).toEqual(expect.not.stringMatching(seedRegex))
      expect(typeof decrypt(encryptedSeed)).toBe('string')
    })

    it('support for details and custom fields', async () => {
      const res = await req()
        .post('/devices')
        .send({
          name: 'testDevice',
          details: {
            physicalAddress: {
              addressLine1: 'Test Street 21',
              city: 'Test City',
              postcode: '11-111',
              country: 'TST'
            },
            deviceType: 'mobile'
          },
          custom: {
            foo: 'bar',
            bar: 'baz',
            baz: 9,
            qux: true,
            fizz: {
              buzz: 15
            }
          }
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      const { encryptedSeed } = res.body
      let seedRegex = /(?:[a-z]{3,}\s){14}[a-z]{3,}/
      expect(encryptedSeed).toEqual(expect.not.stringMatching(seedRegex))
      expect(typeof decrypt(encryptedSeed)).toBe('string')
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

    describe('validation errors', () => {
      const testCases = [
        {
          toString: () => 'name is empty',
          params: {
            name: null
          },
          response: ['name must be a string']
        },
        {
          toString: () => 'connected is invalid type',
          params: {
            connected: 123
          },
          response: ['connected must be a boolean value']
        },
        {
          toString: () => 'active is invalid type',
          params: {
            active: { hello: 42 }
          },
          response: ['active must be a boolean value']
        },
        {
          toString: () => 'visible is invalid type',
          params: {
            visible: 'true'
          },
          response: ['visible must be a boolean value']
        }
      ]

      test.each(testCases)('%s', async ({ params, response }) => {
        const res = await req()
          .post('/devices')
          .send({
            name: 'testDevice',
            active: true,
            connected: true,
            ...params
          })
          .set('Authorization', `Bearer ${token}`)

        expect(res.status).toEqual(400)
        expect(res.body.message).toEqual(response)
      })
    })
  })

  describe('PUT /devices/:address', () => {
    let device = ''

    beforeAll(async () => {
      device = (await createTestDevice(req, token)).address
    })

    const cases = [
      {
        toString: () => 'basic example',
        input: {
          name: 'test_device',
          lat: 52.13,
          active: false,
          details: {
            url: 'http://google.com',
            physicalAddress: {
              country: 'Poland'
            }
          },
          custom: {
            powerLevel: 10
          }
        },
        expected: [
          { key: 'active', type: 'string', value: 'false' },
          { key: 'connected', type: 'boolean', value: true },
          { key: 'custom', type: 'string', value: JSON.stringify({ powerLevel: 10 }) },
          {
            key: 'details',
            type: 'string',
            value: JSON.stringify({
              url: 'http://google.com',
              physicalAddress: {
                country: 'Poland'
              }
            })
          },
          { key: 'lat', type: 'string', value: '52.13' },
          { key: 'name', type: 'string', value: 'test_device' },
          {
            key: 'owner',
            type: 'string',
            value: config().blockchain.dappAddress
          },
          {
            key: 'supplier',
            type: 'string',
            value: config().blockchain.dappAddress
          },
          { key: 'type', type: 'string', value: 'device' },
          { key: 'version', type: 'string', value: '1.0' },
          { key: 'visible', type: 'boolean', value: true }
        ]
      }
    ]

    it.each(cases)('%s', async ({ input, expected }) => {
      const res = await req()
        .put(`/devices/${device}`)
        .send(input)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const entries = await lib.fetchDataWithRegex('.*', device)

      expect(res.body.txHash).toBeDefined()
      expect(entries).toEqual(expected)
    })
  })

  describe('GET /devices', () => {
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
      device = (await createTestDevice(req, token)).address
    })

    it('valid request', async () => {
      const res = await req()
        .get(`/devices/${device}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Object)
      expect(res.body.ownerDapp).toBe(config().blockchain.dappAddress)
      expect(typeof res.body.address).toBe('string')
      expect(typeof res.body.balance).toBe('number')
      expect(res.body.balance).toBeGreaterThanOrEqual(0)
      expect(res.body.connected).toBe(true)
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
      device = (await createTestDevice(req, token)).address
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

  describe('DELETE /devices/:address/keys/:assetId', () => {
    let assetId = ''
    let device = ''

    it('prepare', async () => {
      req = () => request(app.getHttpServer())
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      device = (await createTestDevice(req, token)).address

      const res = await req()
        .post('/keys')
        .send({
          device: device,
          validTo,
          amount: 1,
          recipient: config().blockchain.dappAddress
        })
        .set('Authorization', `Bearer ${token}`)
      assetId = res.body[0].assetId
    })

    it('valid request', async () => {
      req = () => request(app.getHttpServer())
      const res = await req()
        .delete(`/devices/${device}/keys/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(typeof res.body.txHash).toBe('string')
    })

    it('unauthorized', async () => {
      await req().delete(`/devices/${device}/keys/${assetId}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .delete(`/devices/${device}/keys/${assetId}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('POST /devices/:address/keys/:assetId', () => {
    let assetId = ''
    let device = ''
    let fakeDevice = ''

    beforeAll(async () => {
      const validTo = Date.now() + config().key.minDuration + 3_600_000

      const deviceRes = await req()
      device = (await createTestDevice(req, token)).address
      fakeDevice = (await createTestDevice(req, token)).address

      const res = await req()
        .post('/keys')
        .send({
          device: fakeDevice,
          validTo,
          amount: 1,
          recipient: config().blockchain.dappAddress
        })
        .set('Authorization', `Bearer ${token}`)
      assetId = res.body[0].assetId
    })

    it('valid request', async () => {
      const res = await req()
        .post(`/devices/${device}/keys/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
      expect(typeof res.body.txHash).toBe('string')
    })

    it('unauthorized', async () => {
      await req().post(`/devices/${device}/keys/${assetId}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post(`/devices/${device}/keys/${assetId}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('POST /devices/:address/validate_transaction/:assetId', () => {
    let device = ''
    let deviceSeed = ''
    const ctx = {
      org: lib.createAccount(),
      dapp: {
        address: config().blockchain.dappAddress,
        seed: config().blockchain.seed
      },
      user: lib.createAccount(),
      key: {
        assetId: ''
      }
    }

    describe('deviceAction', () => {
      beforeAll(async () => {
        const res = await createTestDevice(req, token)
        device = res.address
        deviceSeed = decrypt(res.encryptedSeed)

        await lib.transfer(ctx.user.address, 0.1, ctx.dapp.seed)

        ctx.key.assetId = await lib.generateKey(device, 99999999999999, ctx.dapp.seed)

        await Promise.all([
          lib.insertData([{ key: `device_${device}`, value: 'active' }], ctx.dapp.seed),
          lib.insertData(
            [{ key: `key_${ctx.key.assetId}`, value: 'active' }],
            deviceSeed
          ),
          lib.transferKey(ctx.user.address, ctx.key.assetId, ctx.dapp.seed)
        ])

        // Have to wait for the next block

        await lib.waitForNBlocks(1)
      })

      const buildTransaction = (seed: string, assetId: string) => {
        return invokeScript(
          {
            dApp: ctx.dapp.address,
            call: {
              function: 'deviceAction',
              args: [
                { type: 'string', value: assetId },
                { type: 'string', value: 'open' }
              ]
            },
            chainId: BLOCKCHAIN_CHAIN_ID,
            version: 1
          },
          seed
        )
      }

      it('valid request', async () => {
        const res = await req()
          .post(`/devices/${device}/validate_transaction/${ctx.key.assetId}`)
          .send(buildTransaction(ctx.user.seed, ctx.key.assetId))
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

        expect(res.body).toEqual({ verified: true })
      })

      describe('invalid requests', () => {
        const testCases = [
          {
            toString: () => 'invalid transaction',
            device: () => device,
            assetId: () => ctx.key.assetId,
            params: () => {
              const transaction = buildTransaction(ctx.user.seed, ctx.key.assetId)
              transaction.proofs = []
              return transaction
            },
            httpCode: 400,
            error: 'Transaction not verified'
          },
          {
            toString: () => 'invalid type of transaction',
            device: () => device,
            assetId: () => ctx.key.assetId,
            params: () =>
              transfer(
                { recipient: ctx.dapp.address, amount: 0.01 * WVS },
                ctx.user.seed
              ),
            httpCode: 400,
            error:
              'Invalid transaction type. Only InvokeScript transactions are supported.'
          },
          {
            toString: () => 'not a transaction',
            device: () => device,
            assetId: () => ctx.key.assetId,
            params: () => ({ foo: 'bar', baz: 'qux' }),
            httpCode: 400,
            error: 'No transaction found'
          },
          {
            toString: () => 'device does not exist',
            device: () => 'foobar',
            assetId: () => ctx.key.assetId,
            params: () => buildTransaction(ctx.user.seed, ctx.key.assetId),
            httpCode: 404
          },
          {
            toString: () => 'asset does not exist',
            device: () => device,
            assetId: () => 'foobar',
            params: () => buildTransaction(ctx.user.seed, ctx.key.assetId),
            httpCode: 404
          }
        ]

        it.each(testCases)('%s', async ({ device, assetId, params, httpCode, error }) => {
          const res = await req()
            .post(`/devices/${device()}/validate_transaction/${assetId()}`)
            .send(params())
            .set('Authorization', `Bearer ${token}`)
            .expect(httpCode)

          if (error) {
            expect(res.body).toEqual({
              verified: false,
              error: error
            })
          }
        })
      })

      it('unauthorized', async () => {
        await req()
          .post(`/devices/${device}/validate_transaction/${ctx.key.assetId}`)
          .send(buildTransaction(ctx.user.seed, ctx.key.assetId))
          .expect(401)
      })
    })

    describe('deviceActionAs', () => {
      beforeAll(async () => {
        const res = await createTestDevice(req, token)
        device = res.address
        deviceSeed = decrypt(res.encryptedSeed)

        await Promise.all([
          lib.transfer(ctx.user.address, 0.1, ctx.dapp.seed),
          lib.transfer(ctx.org.address, 0.1, ctx.dapp.seed)
        ])

        ctx.key.assetId = await lib.generateKey(device, 99999999999999, ctx.dapp.seed)

        await Promise.all([
          lib.insertData(
            [
              { key: `device_${device}`, value: 'active' },
              { key: `org_${ctx.org.address}`, value: 'active' }
            ],
            ctx.dapp.seed
          ),
          lib.insertData(
            [{ key: `key_${ctx.key.assetId}`, value: 'active' }],
            deviceSeed
          ),
          lib.transferKey(ctx.org.address, ctx.key.assetId, ctx.dapp.seed),
          lib.insertData(
            [{ key: `user_${ctx.user.address}`, value: 'active' }],
            ctx.org.seed
          )
        ])

        // Have to wait for the next block

        await lib.waitForNBlocks(1)
      })

      const buildTransaction = (seed: string, assetId: string, org: string) => {
        return invokeScript(
          {
            dApp: ctx.dapp.address,
            call: {
              function: 'deviceActionAs',
              args: [
                { type: 'string', value: assetId },
                { type: 'string', value: 'open' },
                { type: 'string', value: org }
              ]
            },
            chainId: BLOCKCHAIN_CHAIN_ID,
            version: 1
          },
          seed
        )
      }

      it('valid request', async () => {
        const res = await req()
          .post(`/devices/${device}/validate_transaction/${ctx.key.assetId}`)
          .send(buildTransaction(ctx.user.seed, ctx.key.assetId, ctx.org.address))
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

        // console.log(res.body)

        expect(res.body).toEqual({ verified: true })
      })

      describe('invalid requests', () => {
        const testCases = [
          {
            toString: () => 'invalid transaction',
            device: () => device,
            assetId: () => ctx.key.assetId,
            params: () => {
              const transaction = buildTransaction(
                ctx.user.seed,
                ctx.key.assetId,
                ctx.org.address
              )
              transaction.proofs = []
              return transaction
            },
            httpCode: 400,
            error: 'Transaction not verified'
          },
          {
            toString: () => 'invalid type of transaction',
            device: () => device,
            assetId: () => ctx.key.assetId,
            params: () =>
              transfer(
                { recipient: ctx.dapp.address, amount: 0.01 * WVS },
                ctx.user.seed
              ),
            httpCode: 400,
            error:
              'Invalid transaction type. Only InvokeScript transactions are supported.'
          },
          {
            toString: () => 'not a transaction',
            device: () => device,
            assetId: () => ctx.key.assetId,
            params: () => ({ foo: 'bar', baz: 'qux' }),
            httpCode: 400,
            error: 'No transaction found'
          },
          {
            toString: () => 'device does not exist',
            device: () => 'foobar',
            assetId: () => ctx.key.assetId,
            params: () =>
              buildTransaction(ctx.user.seed, ctx.key.assetId, ctx.org.address),
            httpCode: 404
          },
          {
            toString: () => 'asset does not exist',
            device: () => device,
            assetId: () => 'foobar',
            params: () =>
              buildTransaction(ctx.user.seed, ctx.key.assetId, ctx.org.address),
            httpCode: 404
          }
        ]

        it.each(testCases)('%s', async ({ device, assetId, params, httpCode, error }) => {
          const res = await req()
            .post(`/devices/${device()}/validate_transaction/${assetId()}`)
            .send(params())
            .set('Authorization', `Bearer ${token}`)
            .expect(httpCode)

          if (error) {
            expect(res.body).toEqual({
              verified: false,
              error: error
            })
          }
        })
      })

      it('unauthorized', async () => {
        await req()
          .post(`/devices/${device}/validate_transaction/${ctx.key.assetId}`)
          .send(buildTransaction(ctx.user.seed, ctx.key.assetId, ctx.org.address))
          .expect(401)
      })
    })
  })

  describe('POST /devices/connect_existing', () => {
    const validMockResponse = (device: string) => {
      return {
        defaultDataStreamId: `urn:lo:nsid:mysensor:001`,
        description: 'desc',
        group: {
          id: 'E89AE',
          path: '/france/paris'
        },
        id: `urn:lo:nsid:blockchain:${device}`,
        name: 'sensor #12',
        properties: {
          manufacturer: 'MyDeviceMaker, Inc.',
          hwVersion: '2.0.1.7-us_64'
        },
        staticLocation: {
          alt: 5.00001,
          lat: 45.000009,
          lon: -30.00001
        },
        tags: ['demo', 'sensor']
      }
    }

    let device = ''
    const dummyId = `${DEVICE_NAME_PREFIX}foobar`

    beforeAll(async () => {
      device = (await createTestDevice(req, token)).address
    })

    beforeEach(async () => {
      fetchMock.resetMocks()
    })

    describe('valid request', () => {
      describe('when providing blockchain address', () => {
        beforeEach(() => {
          fetchMock.mockIf(
            new RegExp(SUPPLIER_URL),
            JSON.stringify(validMockResponse(device))
          )
        })

        it('returns status 201', async () => {
          await req()
            .post('/devices/connect_existing')
            .send({ deviceId: dummyId, address: device })
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
        })

        it('returns valid device ID', async () => {
          const res = await req()
            .post('/devices/connect_existing')
            .send({ deviceId: dummyId, address: device })
            .set('Authorization', `Bearer ${token}`)

          expect(res.body.details.data.id).toEqual(`${DEVICE_NAME_PREFIX}${device}`)
        })
      })

      describe('when not providing blockchain address', () => {
        beforeEach(() => {
          fetchMock.mockIf(
            new RegExp(SUPPLIER_URL),
            JSON.stringify(validMockResponse(dummyId))
          )
        })

        it('returns status 201', async () => {
          await req()
            .post('/devices/connect_existing')
            .send({ deviceId: dummyId })
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
        })

        it('returns blockchain address', async () => {
          const res = await req()
            .post('/devices/connect_existing')
            .send({ deviceId: dummyId })
            .set('Authorization', `Bearer ${token}`)

          expect(res.body.address).not.toBeUndefined
        })

        it('returns encrypted seed', async () => {
          const res = await req()
            .post('/devices/connect_existing')
            .send({ deviceId: dummyId })
            .set('Authorization', `Bearer ${token}`)

          const { encryptedSeed } = res.body
          let seedRegex = /(?:[a-z]{3,}\s){14}[a-z]{3,}/
          expect(encryptedSeed).toEqual(expect.not.stringMatching(seedRegex))
          expect(typeof decrypt(encryptedSeed)).toBe('string')
        })
      })
    })

    describe('invalid request', () => {
      it('supplier device does not exist', async () => {
        fetchMock.mockIf(new RegExp(SUPPLIER_URL), JSON.stringify({}), { status: 404 })
        await req()
          .post('/devices/connect_existing')
          .send({ deviceId: dummyId, address: device })
          .set('Authorization', `Bearer ${token}`)
          .expect(404)
      })

      it('blockchain account does not exist', async () => {
        fetchMock.mockIf(
          new RegExp(SUPPLIER_URL),
          JSON.stringify(validMockResponse(dummyId))
        )

        await req()
          .post('/devices/connect_existing')
          .send({ deviceId: dummyId, address: dummyId })
          .set('Authorization', `Bearer ${token}`)
          .expect(404)
      })

      it('device details provided but address already provided', async () => {
        fetchMock.mockIf(
          new RegExp(SUPPLIER_URL),
          JSON.stringify(validMockResponse(device))
        )
        const res = await req()
          .post('/devices/connect_existing')
          .send({
            deviceId: dummyId,
            address: device,
            deviceParams: { name: 'rbb', desc: 'rbb desc' }
          })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
      })

      it('supplier api returns internal error', async () => {
        fetchMock.mockIf(new RegExp(SUPPLIER_URL), (req) => {
          return Promise.reject(new Error('Something went wrong'))
        })

        await req()
          .post('/devices/connect_existing')
          .send({ deviceId: dummyId, address: device })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
      })

      it('blockchain API returns internal error', async () => {
        fetchMock.mockIf(new RegExp(BLOCKCHAIN_NODE_URL), (req) => {
          return Promise.reject(new Error('Something went wrong'))
        })

        const res = await req()
          .post('/devices/connect_existing')
          .send({ deviceId: dummyId, address: device })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
      })

      it('device ID not present', async () => {
        const res = await req()
          .post('/devices/connect_existing')
          .send({ address: device })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
      })

      it('device ID is an empty string', async () => {
        await req()
          .post('/devices/connect_existing')
          .send({ deviceId: '', address: device })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
      })

      it('address is an empty string', async () => {
        await req()
          .post('/devices/connect_existing')
          .send({ deviceId: dummyId, address: '' })
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
      })
    })
  })
})
