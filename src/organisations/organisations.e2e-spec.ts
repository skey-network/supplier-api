import { config as configure } from 'dotenv'
configure()

import config from '../config'
import { getInstance } from 'skey-lib'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../app.module'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { readFileSync } from 'fs'

const { chainId, seed, nodeUrl, dappAddress } = config().blockchain
const lib = getInstance({ nodeUrl, chainId })

const getBlockchainState = async (deviceAddress: string, keyAssetId: string) => {
  const [whitelist, key] = await Promise.all([
    lib.fetchDataWithRegex(`key_${keyAssetId}`, deviceAddress),
    lib.fetchKey(keyAssetId)
  ])

  return {
    keyExists: key.quantity === 1,
    keyWhitelisted: whitelist[0]?.value === 'active'
  }
}

describe('Organisations e2e', () => {
  let app: INestApplication

  const ctx = {
    organisation: lib.createAccount(),
    device: lib.createAccount(),
    keyAssetId: '',
    token: ''
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()
  })

  it('sponsor test accounts', async () => {
    await Promise.all([
      lib.transfer(ctx.organisation.address, 1, seed),
      lib.transfer(ctx.device.address, 1, seed)
    ])
  })

  it('set account scripts', async () => {
    const orgScript = readFileSync('./assets/organisation.base64', 'utf-8')
    const deviceScript = readFileSync('./assets/device.base64', 'utf-8')

    await Promise.all([
      lib.setScript(orgScript, ctx.organisation.seed),
      lib.setScript(deviceScript, ctx.device.seed)
    ])
  })

  it('create key', async () => {
    const validTo = 9921328375635
    ctx.keyAssetId = await lib.generateKey(ctx.device.address, validTo, seed)
  })

  it('transfer key to organisation', async () => {
    await lib.transferKey(ctx.organisation.address, ctx.keyAssetId, seed)
  })

  it('set account data entries', async () => {
    await Promise.all([
      lib.insertData([{ key: `org_${ctx.organisation.address}`, value: 'active' }], seed),
      lib.insertData(
        [
          { key: 'supplier', value: dappAddress },
          { key: 'owner', value: dappAddress },
          { key: `key_${ctx.keyAssetId}`, value: 'active' }
        ],
        ctx.device.seed
      )
    ])
  })

  it('POST /auth/login', async () => {
    const { email, password } = config().admin

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201)

    ctx.token = res.body.access_token

    expect(ctx.token).toBeDefined()
  })

  it('validate blockchain state before', async () => {
    const state = await getBlockchainState(ctx.device.address, ctx.keyAssetId)

    expect(state.keyExists).toBe(true)
    expect(state.keyWhitelisted).toBe(true)
  })

  it('interactWithDevice', async () => {
    const txHash = await lib.interactWithDevice(
      ctx.keyAssetId,
      dappAddress,
      'open',
      ctx.organisation.seed
    )

    expect(txHash).toBeDefined()
  })

  it('DELETE /organisations/:org/keys/:key', async () => {
    const path = `/organisations/${ctx.organisation.address}/keys/${ctx.keyAssetId}`

    const res = await request(app.getHttpServer())
      .delete(path)
      .set('Authorization', `Bearer ${ctx.token}`)
      .expect(200)

    expect(res.body.txHashes.length).toBe(2)
  })

  it('validate blockchain state after', async () => {
    const state = await getBlockchainState(ctx.device.address, ctx.keyAssetId)

    expect(state.keyExists).toBe(false)
    expect(state.keyWhitelisted).toBe(false)
  })

  describe('POST /organisations/:address', () => {
    const testOrgAddress = '3M8swwPfYAw72JhdNDDNfUH3Tv2Bm5RQV98'
    const path = `/organisations/${testOrgAddress}`

    describe('valid request', () => {
      it('adds organisation to data storage', async () => {
        const res = await request(app.getHttpServer())
          .post(path)
          .set('Authorization', `Bearer ${ctx.token}`)
          .expect(201)

        expect(res.body.txHashes.length).toBe(1)
      })

      afterEach(async () => {
        const deleteEntry: DeleteEntry = { key: `org_${testOrgAddress}`, value: null }
        await lib.insertData([deleteEntry], seed)
      })
    })

    describe('invalid request', () => {
      const defaults = {
        toString: () => 'invalid request test example',
        orgAddress: testOrgAddress,
        setup: async () => {},
        teardown: async () => {},
        authToken: () => ctx.token,
        httpCode: 422
      }

      const cases = [
        {
          ...defaults,
          toString: () => 'organisation has already been added',
          setup: async () => {
            const orgEntry: StringEntry = {
              key: `org_${testOrgAddress}`,
              value: 'active'
            }
            await lib.insertData([orgEntry], seed)
          },
          teardown: async () => {
            const orgEntry: DeleteEntry = { key: `org_${testOrgAddress}`, value: null }
            await lib.insertData([orgEntry], seed)
          },
          errorMessage: 'Organisation has already been added'
        },
        {
          ...defaults,
          toString: () => 'invalid Address',
          orgAddress: 'foobar',
          httpCode: 400,
          errorMessage: ['address is not valid']
        }
      ]

      test.each(cases)('%s', async (args) => {
        await args.setup()

        try {
          const res = await request(app.getHttpServer())
            .post(`/organisations/${args.orgAddress}`)
            .set('Authorization', `Bearer ${args.authToken()}`)
          expect(res.status).toEqual(args.httpCode)
          if (args.errorMessage) {
            expect(res.body.message).toEqual(args.errorMessage)
          }
        } finally {
          await args.teardown()
        }
      })
    })
  })
})
