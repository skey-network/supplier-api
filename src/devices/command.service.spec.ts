import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { DevicesCommandService } from './command.service'
import { IInvokeScriptTransaction, invokeScript } from '@waves/waves-transactions'
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
    user: lib.createAccount(),
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
        lib.transfer(ctx.device.address, 0.1, ctx.dapp.seed),
        lib.transfer(ctx.otherDapp.address, 0.1, ctx.dapp.seed)
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
            { key: 'supplier', value: ctx.otherDapp.address },
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
        waitForTx: true,
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
        lib.transfer(ctx.device.address, 0.1, ctx.dapp.seed),
        lib.transfer(ctx.otherDapp.address, 0.1, ctx.dapp.seed),
        lib.transfer(ctx.org.address, 0.1, ctx.dapp.seed)
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
            { key: 'supplier', value: ctx.otherDapp.address },
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
        waitForTx: true,
        keyAssetId: ctx.key.assetId,
        keyOwnerAddress: ctx.org.address
      })

      expect(result.script).toBe('deviceActionAs')
      expect(result.txHash).toBeDefined()
    })
  })

  describe('validateTransaction', () => {
    let invokeTx: IInvokeScriptTransaction

    beforeAll(async () => {
      await Promise.all([lib.transfer(ctx.user.address, 0.1, ctx.dapp.seed)])

      ctx.key.assetId = await lib.generateKey(
        ctx.device.address,
        99999999999999,
        ctx.dapp.seed
      )

      await Promise.all([
        lib.insertData(
          [
            { key: `device_${ctx.device.address}`, value: 'active' },
            { key: `key_${ctx.key.assetId}`, value: 'active' }
          ],
          ctx.dapp.seed
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
            function: 'deviceActionWithKey',
            args: [
              { type: 'string', value: assetId },
              { type: 'string', value: 'open' }
            ]
          },
          chainId,
          version: 1
        },
        seed
      )
    }

    beforeEach(() => {
      invokeTx = buildTransaction(ctx.user.seed, ctx.key.assetId)
    })

    it('validates transaction correctly', async () => {
      expect(
        await service.validateTransaction(ctx.device.address, ctx.key.assetId, invokeTx)
      ).toEqual({ verified: true })
    })

    it('transaction is invalid', async () => {
      invokeTx.proofs = []

      const result = await service.validateTransaction(
        ctx.device.address,
        ctx.key.assetId,
        invokeTx
      )

      expect(result.verified).toEqual(false)
      expect(result.error).toBeDefined()
    })

    it('key is not whitelisted in supplier', async () => {
      await lib.insertData(
        [{ key: `key_${ctx.key.assetId}`, value: null }],
        ctx.dapp.seed
      )

      try {
        const result = await service.validateTransaction(
          ctx.device.address,
          ctx.key.assetId,
          invokeTx
        )

        expect(result.verified).toEqual(false)
        expect(result.error).toEqual('key is not whitelisted in supplier')
      } finally {
        await lib.insertData(
          [{ key: `key_${ctx.key.assetId}`, value: 'active' }],
          ctx.dapp.seed
        )
      }
    })

    it('address is not key owner', async () => {
      const testAccount = lib.createAccount()
      const result = await service.validateTransaction(
        ctx.device.address,
        ctx.key.assetId,
        buildTransaction(testAccount.seed, ctx.key.assetId)
      )

      expect(result.verified).toEqual(false)
      expect(result.error).toEqual('address is not key owner')
    })

    it('key has expired', async () => {
      const expiredKey = await lib.generateKey(
        ctx.device.address,
        Date.now() - 1,
        ctx.dapp.seed
      )

      await Promise.all([
        lib.insertData([{ key: `key_${expiredKey}`, value: 'active' }], ctx.dapp.seed),
        lib.transferKey(ctx.user.address, expiredKey, ctx.dapp.seed)
      ])

      // Have to wait for the next block

      await lib.waitForNBlocks(1)

      const result = await service.validateTransaction(
        ctx.device.address,
        expiredKey,
        buildTransaction(ctx.user.seed, expiredKey)
      )

      expect(result.verified).toEqual(false)
      expect(result.error).toEqual('key is invalid')
    })

    it('key belongs to a different device', async () => {
      const fakeDevice = lib.createAccount()
      const invalidKey = await lib.generateKey(
        fakeDevice.address,
        Date.now() - 1,
        ctx.dapp.seed
      )

      await Promise.all([
        lib.insertData([{ key: `key_${invalidKey}`, value: 'active' }], ctx.dapp.seed),
        lib.transferKey(ctx.user.address, invalidKey, ctx.dapp.seed)
      ])

      // Have to wait for the next block

      await lib.waitForNBlocks(1)

      const result = await service.validateTransaction(
        ctx.device.address,
        invalidKey,
        buildTransaction(ctx.user.seed, invalidKey)
      )

      expect(result.verified).toEqual(false)
      expect(result.error).toEqual('key is invalid')
    })
  })
})
