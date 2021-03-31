import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { getInstance } from 'skey-lib'
import config from '../src/config'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('device-command e2e', () => {
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>

  const lib = getInstance({
    nodeUrl: config().blockchain.nodeUrl,
    chainId: config().blockchain.chainId
  })

  let token = ''

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())
  })

  describe('POST /devices/:address/command', () => {
    beforeAll(async () => {
      const res = await req()
        .post('/auth/login')
        .send({
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD
        })
        .expect(201)

      token = res.body.access_token

      await req()
        .post('/utils/setup')
        .send({
          setScript: true
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
    })

    it('unauthorized', async () => {
      await req().post('/devices/aaa/command').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/devices/aaa/command')
        .set('Authorization', 'Bearer aaa')
        .expect(401)
    })

    describe('issuer is not dapp', () => {
      const ctx = {
        device: {
          address: '',
          seed: ''
        },
        user: {
          address: '',
          seed: ''
        },
        assetId: ''
      }

      // TODO

      // it('create scenario', async () => {
      //   const deviceRes = await req()
      //     .post('/devices')
      //     .set('Authorization', `Bearer ${token}`)
      //     .expect(201)

      //   ctx.device = deviceRes.body

      //   const userRes = await req()
      //     .post('/users')
      //     .set('Authorization', `Bearer ${token}`)
      //     .expect(201)

      //   ctx.user = userRes.body

      //   ctx.assetId = await lib.generateKey(
      //     ctx.device.address,
      //     99999999999,
      //     ctx.user.seed
      //   )

      //   await lib.insertData(
      //     [{ key: `key_${ctx.assetId}`, value: 'active', type: 'string' }],
      //     config().blockchain.seed
      //   )
      // })

      it('invokes script', async () => {
        const res = await req()
          .post(`/devices/${ctx.device.address}/command`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            action: 'open',
            senderAddress: ctx.user.address,
            keyAssetId: ctx.assetId
          })
          .expect(201)

        console.log(res.body)
      })
    })
  })
})
