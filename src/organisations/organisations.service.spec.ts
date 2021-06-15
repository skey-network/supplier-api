import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { OrganisationsService } from './organisations.service'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import config from '../config'

const { dappAddress } = config().blockchain

describe('OrganisationsService', () => {
  let service: OrganisationsService
  let blockchainWriteService: BlockchainWriteService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganisationsService, BlockchainWriteService]
    }).compile()

    service = module.get<OrganisationsService>(OrganisationsService)
    blockchainWriteService = module.get<BlockchainWriteService>(BlockchainWriteService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('lib getter', () => {
    it('is defined', () => {
      expect(service.lib).toBeDefined()
    })
  })

  describe('handleNotFound', () => {
    const cases = [
      {
        toString: () => 'valid request',
        entries: [null],
        key: { issuer: dappAddress },
        expectError: false
      },
      {
        toString: () => 'no entries',
        entries: [],
        key: { issuer: dappAddress },
        expectError: true
      },
      {
        toString: () => 'no key',
        entries: [null],
        key: null,
        expectError: true
      },
      {
        toString: () => 'invalid key',
        entries: [null],
        key: { issuer: 'aaa' },
        expectError: true
      }
    ]

    test.each(cases)('%s', ({ entries, key, expectError }) => {
      let error = false

      try {
        service.handleNotFound(key, entries)
      } catch {
        error = true
      }

      expect(error).toBe(expectError)
    })
  })

  describe('removeKey', () => {
    const cases = [
      {
        toString: () => 'basic example',
        org: '3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
        asset: '85u7QmR14gPEGXCNe27D2KPUo6US78Hy8ub2hEnU4fRL',
        key: { issuer: dappAddress },
        entries: [null],
        keyDetails: { device: '3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy' }
      }
    ]

    test.each(cases)('%s', async (args) => {
      jest.spyOn(service, 'lib', 'get').mockReturnValue({
        fetchDataWithRegex: () => args.entries,
        fetchKey: () => args.key,
        extractValuesFromKey: () => args.keyDetails
      } as any)

      jest.spyOn(blockchainWriteService, 'broadcast').mockResolvedValue('hash')

      const { txHashes } = await service.removeKey(args.org, args.asset)

      expect(txHashes).toEqual(['hash', 'hash'])
    })
  })
})
