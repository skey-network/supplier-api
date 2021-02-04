import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { WavesReadService } from './waves.read.service'
import config from '../config'
import { WavesWriteService } from './waves.write.service'

jest.setTimeout(3600000)

describe('WavesReadService', () => {
  let service: WavesReadService
  let writeService: WavesWriteService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WavesReadService, WavesWriteService]
    }).compile()

    service = module.get<WavesReadService>(WavesReadService)
    writeService = module.get<WavesWriteService>(WavesWriteService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('randomString', () => {
    expect(typeof service.randomString()).toBe('string')
  })

  it('generateAccount', () => {
    const account = service.generateAccount()

    expect(typeof account.address).toBe('string')
    expect(typeof account.seed).toBe('string')
  })

  it('readData', async () => {
    await writeService.insertData([{ key: 'test_key', value: 'test_value' }])
    const data = await service.readData('test_key')
    expect(data).toBe('test_value')
  })

  it('fetchWithRegex', async () => {
    await writeService.insertData([{ key: 'test_key', value: 'test_value' }])
    const data = await service.fetchWithRegex('test_key')
    expect(data.find((item) => item.value === 'test_value')).toBeTruthy()
  })

  it('balance', async () => {
    const { dappAddress } = config().waves
    const balance = await service.balance(dappAddress)
    expect(balance).toBeGreaterThanOrEqual(0)
  })

  it('assetBalance', async () => {
    const { dappAddress } = config().waves
    const assetId = await writeService.generateKey('aaa', 1)
    const balance = await service.assetBalance(dappAddress, assetId)
    expect(balance).toBe(1)
  })

  it('fetchAsset', async () => {
    const assetId = await writeService.generateKey('aaa', 1)
    const data = await service.fetchAsset(assetId)
    expect(data.assetId).toBe(assetId)
  })

  it('fetchNFTs', async () => {
    await writeService.generateKey('aaa', 1)
    const data = await service.fetchNFTs(1)
    expect(data[0].assetId).toBeDefined()
  })
})
