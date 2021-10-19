import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { getInstance } from 'skey-lib'
import config from '../src/config'
import { readFileSync } from 'fs'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('device-command e2e', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>

  const lib = getInstance({
    nodeUrl: config().blockchain.nodeUrl,
    chainId: config().blockchain.chainId
  })

  const ctx = {
    token: '',
    device: lib.createAccount(),
    org: lib.createAccount(),
    dapp: {
      seed: config().blockchain.seed,
      address: config().blockchain.dappAddress
    },
    dapp2: lib.createAccount(),
    key: {
      assetId: ''
    }
  }

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())
  })

  afterAll(async () => {
    await app.close()
    await moduleFixture.close()
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

      ctx.token = res.body.access_token

      await req()
        .post('/utils/setup')
        .send({
          setScript: true
        })
        .set('Authorization', `Bearer ${ctx.token}`)
        .expect(201)
    })

    it('unauthorized', async () => {
      await req().post('/devices/aaa/commands/command').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/devices/aaa/commands/command')
        .set('Authorization', 'Bearer aaa')
        .expect(401)
    })

    describe('issuer is not dapp', () => {
      it('prepare', async () => {
        ctx.device = lib.createAccount()
        ctx.org = lib.createAccount()

        await Promise.all([
          lib.transfer(ctx.device.address, 2, ctx.dapp.seed),
          lib.transfer(ctx.org.address, 2, ctx.dapp.seed),
          lib.transfer(ctx.dapp2.address, 2, ctx.dapp.seed)
        ])

        ctx.key.assetId = await lib.generateKey(
          ctx.device.address,
          99999999999999,
          ctx.dapp2.seed
        )

        const script = readFileSync('./assets/dapp.base64').toString()

        await Promise.all([
          lib.insertData(
            [
              { key: `device_${ctx.device.address}`, value: 'active' },
              {
                key: `org_${ctx.org.address}`,
                value: 'active'
              }
            ],
            ctx.dapp2.seed
          ),
          lib.insertData(
            [
              { key: `key_${ctx.key.assetId}`, value: 'active' },
              { key: 'dapp', value: ctx.dapp2.address },
              { key: 'owner', value: ctx.dapp2.address }
            ],
            ctx.device.seed
          ),
          lib.insertData(
            [{ key: `user_${ctx.dapp.address}`, value: 'active' }],
            ctx.org.seed
          ),
          lib.transferKey(ctx.org.address, ctx.key.assetId, ctx.dapp2.seed),
          lib.setScript(script, ctx.dapp2.seed)
        ])

        await lib.waitForNBlocks(1)
      })

      it('invokes script', async () => {
        const res = await req()
          .post(`/devices/${ctx.device.address}/commands/open`)
          .set('Authorization', `Bearer ${ctx.token}`)
          .send({
            action: 'open',
            senderAddress: ctx.org.address,
            keyAssetId: ctx.key.assetId,
            keyOwnerAddress: ctx.org.address
          })
          .expect(201)

        expect(res.body.script).toBe('deviceActionAs')
        expect(res.body.txHash).toBeDefined()
        expect(res.body.waitForTx).toBe(true)
      })
    })

    describe('issuer is dapp and can interact', () => {
      it('prepare', async () => {
        ctx.device = lib.createAccount()

        await Promise.all([
          lib.transfer(ctx.device.address, 2, ctx.dapp.seed),
          lib.transfer(ctx.org.address, 2, ctx.dapp.seed),
          lib.transfer(ctx.dapp2.address, 2, ctx.dapp.seed)
        ])

        ctx.key.assetId = await lib.generateKey(
          ctx.device.address,
          99999999999999,
          ctx.dapp2.seed
        )

        const script = readFileSync('./assets/dapp.base64').toString()

        await Promise.all([
          lib.insertData(
            [
              { key: `device_${ctx.device.address}`, value: 'active' },
              {
                key: `org_${ctx.org.address}`,
                value: 'active'
              }
            ],
            ctx.dapp2.seed
          ),
          lib.insertData(
            [
              { key: `key_${ctx.key.assetId}`, value: 'active' },
              { key: 'dapp', value: ctx.dapp2.address },
              { key: 'owner', value: ctx.dapp2.address }
            ],
            ctx.device.seed
          ),
          lib.insertData(
            [{ key: `user_${ctx.dapp.address}`, value: 'active' }],
            ctx.org.seed
          ),
          lib.transferKey(ctx.org.address, ctx.key.assetId, ctx.dapp2.seed),
          lib.setScript(script, ctx.dapp2.seed)
        ])

        await lib.waitForNBlocks(1)
      })

      it('invokes script', async () => {
        const res = await req()
          .post(`/devices/${ctx.device.address}/commands/open`)
          .set('Authorization', `Bearer ${ctx.token}`)
          .send({
            action: 'open',
            senderAddress: ctx.org.address,
            keyAssetId: ctx.key.assetId,
            keyOwnerAddress: ctx.org.address
          })
          .expect(201)

        expect(res.body.script).toBe('deviceActionAs')
        expect(res.body.txHash).toBeDefined()
        expect(res.body.waitForTx).toBe(true)
      })
    })
  })
})
