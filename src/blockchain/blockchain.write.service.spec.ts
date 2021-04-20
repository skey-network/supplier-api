import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { BlockchainWriteService } from './blockchain.write.service'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'
import { readFileSync } from 'fs'

jest.setTimeout(3600000)

const generateAccount = () => {
  const chainId = config().blockchain.chainId
  const seed = Crypto.randomSeed()
  return { seed, address: Crypto.address(seed, chainId) }
}

describe('blockchainWriteService', () => {
  let service: BlockchainWriteService

  const ctx = {
    device: {
      address: '',
      seed: ''
    },
    assetId1: '',
    assetId2: ''
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainWriteService]
    }).compile()

    service = module.get<BlockchainWriteService>(BlockchainWriteService)
  })

  it('prepare for next tests', async () => {
    const { dappAddress } = config().blockchain
    const script = readFileSync('./assets/device.base64').toString()
    ctx.device = generateAccount()
    ctx.assetId1 = await service.generateKey(ctx.device.address, 9999999999999)
    ctx.assetId2 = await service.generateKey(ctx.device.address, 9999999999999)
    await service.faucet(ctx.device.address, 10000000)
    await service.setScript(script, ctx.device.seed)
    await service.insertData(
      [
        { key: 'owner', value: dappAddress },
        { key: 'dapp', value: dappAddress }
      ],
      ctx.device.seed
    )
  })

  it('updateDeviceData', async () => {
    const txHash = await service.updateDeviceData(ctx.device.address, [
      { key: 'a', value: 1 }
    ])
    expect(typeof txHash).toBe('string')
  })

  it('addKeyToDevice', async () => {
    const txHash = await service.addKeyToDevice(ctx.assetId2, ctx.device.address)
    expect(typeof txHash).toBe('string')
  })

  it('addNKeysToDevice', async () => {
    const txHash = await service.addNKeysToDevice(
      [ctx.assetId1, ctx.assetId2],
      ctx.device.address
    )
    expect(typeof txHash).toBe('string')
  })

  it('interactWithDevice', async () => {
    const txHash = await service.interactWithDevice(
      'open',
      ctx.assetId1,
      config().blockchain.seed
    )

    expect(typeof txHash).toBe('string')
  })

  it('removeKeyFromDevice', async () => {
    const txHash = await service.removeKeyFromDevice(ctx.assetId2, ctx.device.address)
    expect(typeof txHash).toBe('string')
  })
})
