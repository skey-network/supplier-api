import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { DevicesCommandService } from './command.service'
import { getInstance } from 'skey-lib'
import config from '../config'
import { readFileSync } from 'fs'

jest.setTimeout(3600000)

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain
const lib = getInstance({ nodeUrl, chainId })

describe('DevicesCommandService', () => {
  let service: DevicesCommandService

  const ctx = {
    dapp: {
      address: dappAddress,
      seed: dappSeed
    },
    otherDapp: lib.createAccount(),
    device: lib.createAccount(),
    org: lib.createAccount(),
    key: {
      assetId: ''
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicesCommandService]
    }).compile()

    service = module.get<DevicesCommandService>(DevicesCommandService)
  })

  describe('issuer is not dapp && dapp is key owner', () => {
    beforeAll(async () => {
      await Promise.all([
        lib.transfer(ctx.device.address, 2, ctx.dapp.seed),
        lib.transfer(ctx.otherDapp.address, 2, ctx.dapp.seed)
      ])

      ctx.key.assetId = await lib.generateKey(
        ctx.device.address,
        99999999999999,
        ctx.otherDapp.seed
      )

      const script = readFileSync('./assets/dapp.base64').toString()

      await Promise.all([
        lib.insertData(
          [{ key: `device_${ctx.device.address}`, value: 'active' }],
          ctx.otherDapp.seed
        ),
        lib.insertData(
          [
            { key: `key_${ctx.key.assetId}`, value: 'active' },
            { key: 'dapp', value: ctx.otherDapp.address },
            { key: 'owner', value: ctx.otherDapp.address }
          ],
          ctx.device.seed
        ),
        lib.transferKey(ctx.dapp.address, ctx.key.assetId, ctx.otherDapp.seed),
        lib.setScript(script, ctx.otherDapp.seed)
      ])
    })

    it('invokes deviceAction script', async () => {
      const result = await service.deviceCommand({
        deviceAddress: ctx.device.address,
        command: 'open',
        waitForTx: 'false',
        keyAssetId: ctx.key.assetId,
        keyOwnerAddress: ctx.dapp.address
      })

      expect(result.script).toBe('deviceAction')
      expect(result.txHash).toBeDefined()
    })
  })

  describe('issuer is not dapp && dapp is not key owner', () => {
    beforeAll(async () => {
      ctx.device = lib.createAccount()
      ctx.otherDapp = lib.createAccount()
      ctx.org = lib.createAccount()

      await Promise.all([
        lib.transfer(ctx.device.address, 2, ctx.dapp.seed),
        lib.transfer(ctx.otherDapp.address, 2, ctx.dapp.seed),
        lib.transfer(ctx.org.address, 2, ctx.dapp.seed)
      ])

      ctx.key.assetId = await lib.generateKey(
        ctx.device.address,
        99999999999999,
        ctx.otherDapp.seed
      )

      const script = readFileSync('./assets/dapp.base64').toString()

      await Promise.all([
        lib.insertData(
          [
            { key: `device_${ctx.device.address}`, value: 'active' },
            { key: `org_${ctx.org.address}`, value: 'active' }
          ],
          ctx.otherDapp.seed
        ),
        lib.insertData(
          [
            { key: `key_${ctx.key.assetId}`, value: 'active' },
            { key: 'dapp', value: ctx.otherDapp.address },
            { key: 'owner', value: ctx.otherDapp.address }
          ],
          ctx.device.seed
        ),
        lib.insertData(
          [{ key: `user_${ctx.dapp.address}`, value: 'active' }],
          ctx.org.seed
        ),
        lib.transferKey(ctx.org.address, ctx.key.assetId, ctx.otherDapp.seed),
        lib.setScript(script, ctx.otherDapp.seed)
      ])
    })

    it('invokes deviceActionAs script', async () => {
      const result = await service.deviceCommand({
        deviceAddress: ctx.device.address,
        command: 'open',
        waitForTx: 'false',
        keyAssetId: ctx.key.assetId,
        keyOwnerAddress: ctx.org.address
      })

      expect(result.script).toBe('deviceActionAs')
      expect(result.txHash).toBeDefined()
    })
  })
})
