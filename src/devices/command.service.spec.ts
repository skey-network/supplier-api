import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { DevicesCommandService } from './command.service'
import {
  IInvokeScriptTransaction,
  invokeScript,
  transfer
} from '@waves/waves-transactions'
import { getInstance } from 'skey-lib'
import config from '../config'
import { readFileSync } from 'fs'
import { WVS } from 'skey-lib/dist/src/write'

jest.setTimeout(3600000)

const { nodeUrl, chainId, dappAddress, seed: dappSeed } = config().blockchain
const lib = getInstance({ nodeUrl, chainId })

describe('DevicesCommandService', () => {
  let module: TestingModule
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
    },
    invalidKey: {
      assetId: ''
    }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [DevicesCommandService]
    }).compile()

    service = module.get<DevicesCommandService>(DevicesCommandService)
  })

  afterEach(async () => {
    await module.close()
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
        keyOwnerAddress: ctx.dapp.address,
        callerAddress: ctx.dapp.address
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
        keyOwnerAddress: ctx.org.address,
        callerAddress: ctx.dapp.address
      })

      expect(result.script).toBe('deviceActionAs')
      expect(result.txHash).toBeDefined()
    })
  })

  describe('validateTransaction', () => {
    let invokeTx: IInvokeScriptTransaction

    describe('deviceAction', () => {
      beforeAll(async () => {
        await Promise.all([lib.transfer(ctx.user.address, 0.1, ctx.dapp.seed)])

        ctx.key.assetId = await lib.generateKey(
          ctx.device.address,
          99999999999999,
          ctx.dapp.seed
        )

        await Promise.all([
          lib.insertData(
            [{ key: `device_${ctx.device.address}`, value: 'active' }],
            ctx.dapp.seed
          ),
          lib.insertData(
            [
              { key: `key_${ctx.key.assetId}`, value: 'active' },
              { key: 'supplier', value: ctx.dapp.address },
              { key: 'owner', value: ctx.dapp.address }
            ],
            ctx.device.seed
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

      describe('validation errors', () => {
        const testCases = [
          {
            toString: () => 'transaction is invalid',
            setup: async () => {},
            teardown: async () => {},
            device: () => ctx.device.address,
            key: () => ctx.key.assetId,
            tx: () => {
              invokeTx.proofs = []
              return invokeTx
            },
            errorMessage: null
          },
          {
            toString: () => 'Key is not whitelisted in the device',
            setup: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.key.assetId}`, value: null }],
                ctx.device.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.key.assetId}`, value: 'active' }],
                ctx.device.seed
              )
            },
            device: () => ctx.device.address,
            key: () => ctx.key.assetId,
            tx: () => invokeTx,
            errorMessage: 'key is not whitelisted in device'
          },
          {
            toString: () => 'Device is not whitelisted in the supplier',
            setup: async () => {
              await lib.insertData(
                [{ key: `device_${ctx.device.address}`, value: null }],
                ctx.dapp.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `device_${ctx.device.address}`, value: 'active' }],
                ctx.dapp.seed
              )
            },
            device: () => ctx.device.address,
            key: () => ctx.key.assetId,
            tx: () => invokeTx,
            errorMessage: 'device is not whitelisted in supplier'
          },
          {
            toString: () => 'Address is not key owner',
            setup: async () => {},
            teardown: async () => {},
            device: () => ctx.device.address,
            key: () => ctx.key.assetId,
            tx: () => buildTransaction(lib.createAccount().seed, ctx.key.assetId),
            errorMessage: 'address is not key owner'
          },
          {
            toString: () => 'Key has expired',
            setup: async () => {
              ctx.invalidKey.assetId = await lib.generateKey(
                ctx.device.address,
                Date.now() - 1,
                ctx.dapp.seed
              )

              await Promise.all([
                lib.insertData(
                  [{ key: `key_${ctx.invalidKey.assetId}`, value: 'active' }],
                  ctx.device.seed
                ),
                lib.transferKey(ctx.user.address, ctx.invalidKey.assetId, ctx.dapp.seed)
              ])

              // Have to wait for the next block
              await lib.waitForNBlocks(1)
            },
            teardown: async () => {},
            device: () => ctx.device.address,
            key: () => ctx.invalidKey.assetId,
            tx: () => buildTransaction(ctx.device.address, ctx.invalidKey.assetId),
            errorMessage: 'key has expired'
          },
          {
            toString: () => 'Key belongs to a different device',
            setup: async () => {
              ctx.invalidKey.assetId = await lib.generateKey(
                lib.createAccount().address,
                Date.now() + 3_600_000,
                ctx.dapp.seed
              )

              await Promise.all([
                lib.insertData(
                  [{ key: `key_${ctx.invalidKey.assetId}`, value: 'active' }],
                  ctx.device.seed
                ),
                lib.transferKey(ctx.user.address, ctx.invalidKey.assetId, ctx.dapp.seed)
              ])

              // Have to wait for the next block
              await lib.waitForNBlocks(1)
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.invalidKey.assetId}`, value: null }],
                ctx.device.seed
              )
            },
            device: () => ctx.device.address,
            key: () => ctx.invalidKey.assetId,
            tx: () => buildTransaction(ctx.device.address, ctx.invalidKey.assetId),
            errorMessage: 'key is not assigned to this device'
          },
          {
            toString: () => 'Wrong script',
            setup: async () => {},
            teardown: async () => {},
            device: () => ctx.device.address,
            key: () => ctx.key.assetId,
            tx: () => {
              return invokeScript(
                {
                  dApp: ctx.dapp.address,
                  call: {
                    function: 'invalidAction',
                    args: []
                  },
                  chainId,
                  version: 1
                },
                ctx.user.seed
              )
            },
            errorMessage:
              'Function not supported. Only supported functions are `deviceAction` and `deviceActionAs`'
          }
        ]

        it.each(testCases)('%s', async (args) => {
          try {
            await args.setup()

            const result = await service.validateTransaction(
              args.device(),
              args.key(),
              args.tx()
            )

            expect(result.verified).toEqual(false)
            if (args.errorMessage) {
              expect(result.error).toEqual(args.errorMessage)
            } else {
              expect(result.error).toBeDefined()
            }
          } finally {
            await args.teardown()
          }
        })
      })
    })

    describe('deviceActionAs', () => {
      beforeAll(async () => {
        ctx.device = lib.createAccount()
        ctx.org = lib.createAccount()

        await Promise.all([
          lib.transfer(ctx.device.address, 0.1, ctx.dapp.seed),
          lib.transfer(ctx.org.address, 0.1, ctx.dapp.seed)
        ])

        ctx.key.assetId = await lib.generateKey(
          ctx.device.address,
          99999999999999,
          ctx.dapp.seed
        )

        await Promise.all([
          lib.insertData(
            [
              { key: `device_${ctx.device.address}`, value: 'active' },
              { key: `org_${ctx.org.address}`, value: 'active' }
            ],
            ctx.dapp.seed
          ),
          lib.insertData(
            [
              { key: 'supplier', value: ctx.dapp.address },
              { key: 'owner', value: ctx.dapp.address },
              { key: `key_${ctx.key.assetId}`, value: 'active' }
            ],
            ctx.device.seed
          ),
          lib.insertData(
            [{ key: `user_${ctx.user.address}`, value: 'active' }],
            ctx.org.seed
          ),
          lib.transferKey(ctx.org.address, ctx.key.assetId, ctx.dapp.seed)
        ])

        // Have to wait for the next block
        await lib.waitForNBlocks(1)
      })

      const buildTransaction = (seed: string, assetId: string) => {
        return invokeScript(
          {
            dApp: ctx.dapp.address,
            call: {
              function: 'deviceActionAs',
              args: [
                { type: 'string', value: assetId },
                { type: 'string', value: 'open' },
                { type: 'string', value: ctx.org.address }
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

      describe('validation errors', () => {
        const generateAndTransferKey = async (
          deviceAddress: string,
          recipientAddress: string,
          timestamp: number
        ) => {
          const assetId = await lib.generateKey(deviceAddress, timestamp, ctx.dapp.seed)

          await Promise.all([
            lib.insertData([{ key: `key_${assetId}`, value: 'active' }], ctx.device.seed),
            lib.transferKey(recipientAddress, assetId, ctx.dapp.seed)
          ])

          // Have to wait for the next block
          await lib.waitForNBlocks(1)

          return assetId
        }

        let testCases = [
          {
            toString: () => 'user is not a member of the organisation',
            setup: async () => {
              await lib.insertData(
                [{ key: `user_${ctx.user.address}`, value: null }],
                ctx.org.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `user_${ctx.user.address}`, value: 'active' }],
                ctx.org.seed
              )
            },
            tx: () => invokeTx,
            key: () => ctx.key.assetId,
            device: () => ctx.device.address
          },
          {
            toString: () => 'key is not whitelisted in device',
            setup: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.key.assetId}`, value: null }],
                ctx.device.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.key.assetId}`, value: 'active' }],
                ctx.device.seed
              )
            },
            tx: () => invokeTx,
            key: () => ctx.key.assetId,
            device: () => ctx.device.address
          },
          {
            toString: () => 'key has expired',
            setup: async () => {
              ctx.invalidKey.assetId = await generateAndTransferKey(
                ctx.device.address,
                ctx.org.address,
                Date.now() - 1_000
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.invalidKey.assetId}`, value: null }],
                ctx.device.seed
              )
            },
            tx: () => buildTransaction(ctx.user.seed, ctx.invalidKey.assetId),
            key: () => ctx.invalidKey.assetId,
            device: () => ctx.device.address
          },
          {
            toString: () => 'key is not assigned to this device',
            setup: async () => {
              ctx.invalidKey.assetId = await generateAndTransferKey(
                lib.createAccount().address,
                ctx.org.address,
                Date.now() + 3_600_000
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.invalidKey.assetId}`, value: null }],
                ctx.dapp.seed
              )
            },
            tx: () => buildTransaction(ctx.user.seed, ctx.invalidKey.assetId),
            key: () => ctx.invalidKey.assetId,
            device: () => ctx.device.address
          },
          {
            toString: () => 'organisation is not whitelisted in the supplier',
            setup: async () => {
              await lib.insertData(
                [{ key: `org_${ctx.org.address}`, value: null }],
                ctx.dapp.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `org_${ctx.org.address}`, value: 'active' }],
                ctx.dapp.seed
              )
            },
            tx: () => buildTransaction(ctx.user.seed, ctx.key.assetId),
            key: () => ctx.key.assetId,
            device: () => ctx.device.address
          },
          {
            toString: () => 'organisation does not own the key',
            setup: async () => {
              ctx.invalidKey.assetId = await generateAndTransferKey(
                ctx.device.address,
                ctx.user.address,
                Date.now() + 3_600_000
              )
              await lib.insertData(
                [{ key: `key_${ctx.invalidKey.assetId}`, value: 'active' }],
                ctx.device.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `key_${ctx.invalidKey.assetId}`, value: null }],
                ctx.device.seed
              )
            },
            tx: () => buildTransaction(ctx.user.seed, ctx.invalidKey.assetId),
            key: () => ctx.invalidKey.assetId,
            device: () => ctx.device.address
          },
          {
            toString: () => 'device is not whitelisted in supplier',
            setup: async () => {
              await lib.insertData(
                [{ key: `device_${ctx.device.address}`, value: null }],
                ctx.dapp.seed
              )
            },
            teardown: async () => {
              await lib.insertData(
                [{ key: `device_${ctx.device.address}`, value: 'active' }],
                ctx.dapp.seed
              )
            },
            tx: () => invokeTx,
            key: () => ctx.key.assetId,
            device: () => ctx.device.address
          }
        ]

        it.each(testCases)(
          '%s',
          async ({ setup, teardown, toString, tx, key, device }) => {
            try {
              await setup()
              expect(await service.validateTransaction(device(), key(), tx())).toEqual({
                verified: false,
                error: toString()
              })
            } finally {
              await teardown()
            }
          }
        )
      })
    })
  })
})
