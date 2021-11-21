import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { BlockchainReadService } from './blockchain.read.service'
import config from '../config'
import { BlockchainWriteService } from './blockchain.write.service'
import * as Transactions from '@waves/waves-transactions'

const { chainId } = config().blockchain
const feeMultiplier = 10 ** 5

const generateAlias = (): string => {
  return 'testalias_' + Math.random().toString(36).substring(7)
}

const fullAlias = (alias: string) => {
  return `alias:${chainId}:${alias}`
}

jest.setTimeout(3600000)

describe('BlockchainReadService', () => {
  let moduleFixture: TestingModule
  let service: BlockchainReadService
  let writeService: BlockchainWriteService

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      providers: [BlockchainReadService, BlockchainWriteService]
    }).compile()

    service = moduleFixture.get<BlockchainReadService>(BlockchainReadService)
    writeService = moduleFixture.get<BlockchainWriteService>(BlockchainWriteService)
  })

  afterAll(async () => {
    await moduleFixture.close()
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

  it('fetchAliases', async () => {
    const account = service.generateAccount()
    await writeService.faucet(account.address, 5 * feeMultiplier)

    const alias = generateAlias()
    await writeService.setAlias(alias, account.seed)

    const result = await service.fetchAliases(account.address)
    expect(result.length).toEqual(1)
    expect(result[0]).toEqual(fullAlias(alias))
  })

  it('fetchDAppAliases', async () => {
    const alias = generateAlias()
    await writeService.setDAppAlias(alias)
    const result = await service.fetchDAppAliases()

    expect(result.length).toBeGreaterThan(0)
    expect(result).toEqual(expect.arrayContaining([fullAlias(alias)]))
  })
})
