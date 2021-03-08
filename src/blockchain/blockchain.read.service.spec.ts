import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { BlockchainReadService } from './blockchain.read.service'
import config from '../config'
import { BlockchainWriteService } from './blockchain.write.service'
import * as Transactions from '@waves/waves-transactions'

jest.setTimeout(3600000)

describe('BlockchainReadService', () => {
  let service: BlockchainReadService
  let writeService: BlockchainWriteService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainReadService, BlockchainWriteService]
    }).compile()

    service = module.get<BlockchainReadService>(BlockchainReadService)
    writeService = module.get<BlockchainWriteService>(BlockchainWriteService)
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
    const { dappAddress } = config().blockchain
    const balance = await service.balance(dappAddress)
    expect(balance).toBeGreaterThanOrEqual(0)
  })

  it('assetBalance', async () => {
    const { dappAddress } = config().blockchain
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

  it('fetchAllNFTs', async () => {
    const account = service.generateAccount()
    await writeService.faucet(account.address, 1000)

    const keys = await writeService.generateNKeys('aaa', 1, 5)

    await Promise.all(
      keys.map((key) => {
        return writeService.transfer(account.address, key)
      })
    )

    await Transactions.nodeInteraction.waitNBlocks(2)

    const result = await service.fetchAllNFTs(account.address, 2)

    expect(result.map((item) => item.assetId).sort()).toEqual(keys.sort())
  })
})
