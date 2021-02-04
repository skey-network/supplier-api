import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { WavesWriteService } from './waves.write.service'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'
import { readFileSync } from 'fs'

jest.setTimeout(3600000)

const generateAccount = () => {
  const chainId = config().waves.chainId
  const seed = Crypto.randomSeed()
  return { seed, address: Crypto.address(seed, chainId) }
}

describe('WavesWriteService', () => {
  let service: WavesWriteService

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
      providers: [WavesWriteService]
    }).compile()

    service = module.get<WavesWriteService>(WavesWriteService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('insertData', async () => {
    const txHash = await service.insertData([
      { key: 'test_key', value: 'test_value' }
    ])
    expect(typeof txHash).toBe('string')
  })

  it('generateKey', async () => {
    const { address } = generateAccount()
    const validTo = Date.now()

    const txHash = await service.generateKey(address, validTo)

    expect(typeof txHash).toBe('string')
  })

  it('generateNKeys', async () => {
    const { address } = generateAccount()
    const validTo = Date.now()
    const amount = config().key.maxAmount < 4 ? 1 : 4

    const hashes = await service.generateNKeys(address, validTo, amount)

    expect(hashes).toBeInstanceOf(Array)
    expect(typeof hashes[0]).toBe('string')
  })

  it('transfer', async () => {
    // depends on generateKey

    const { address } = generateAccount()
    const assetId = await service.generateKey('aaa', 1)
    const txHash = await service.transfer(address, assetId)

    expect(typeof txHash).toBe('string')
  })

  it('faucet', async () => {
    const { address } = generateAccount()

    const txHash = await service.faucet(address, 10000000)

    expect(typeof txHash).toBe('string')
  })

  it('setScript', async () => {
    const script = readFileSync('./assets/dapp.base64').toString()
    const { seed } = config().waves

    const txHash = await service.setScript(script, seed)

    expect(typeof txHash).toBe('string')
  })

  it('burnKey', async () => {
    // depends on generateKey

    const assetId = await service.generateKey('aaa', 12)
    const txHash = await service.burnKey(assetId)

    expect(typeof txHash).toBe('string')
  })

  it('prepare for next tests', async () => {
    const { dappAddress } = config().waves
    const script = readFileSync('./assets/device.base64').toString()
    ctx.device = generateAccount()
    ctx.assetId1 = await service.generateKey('aaa', 1)
    ctx.assetId2 = await service.generateKey('bbb', 2)
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
    const txHash = await service.addKeyToDevice(
      ctx.assetId2,
      ctx.device.address
    )
    expect(typeof txHash).toBe('string')
  })

  it('addNKeysToDevice', async () => {
    const txHash = await service.addNKeysToDevice(
      [ctx.assetId1, ctx.assetId2],
      ctx.device.address
    )
    expect(typeof txHash).toBe('string')
  })
})
