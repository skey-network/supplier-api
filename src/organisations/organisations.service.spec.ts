import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { OrganisationsService } from './organisations.service'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import config from '../config'
import { UnprocessableEntityException } from '@nestjs/common'

const { dappAddress } = config().blockchain

describe('OrganisationsService', () => {
  let moduleFixture: TestingModule
  let service: OrganisationsService
  let blockchainWriteService: BlockchainWriteService

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      providers: [OrganisationsService, BlockchainWriteService]
    }).compile()

    service = moduleFixture.get<OrganisationsService>(OrganisationsService)
    blockchainWriteService =
      moduleFixture.get<BlockchainWriteService>(BlockchainWriteService)
  })

  afterAll(async () => {
    await moduleFixture.close()
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

  describe('addOrganisation', () => {
    const cases = [
      {
        toString: () => 'basic example',
        org: '3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
        entries: [],
        assert: async (serviceFn: () => any) => {
          const res = await serviceFn()
          expect(res).toEqual({ txHashes: ['hash'] })
        }
      },
      {
        toString: () => 'organisation already added',
        org: '3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
        entries: [
          {
            key: 'org_3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
            value: 'active',
            type: 'string'
          }
        ],
        assert: async (serviceFn: () => any) => {
          expect.assertions(2)

          try {
            await serviceFn()
          } catch (e) {
            expect(e).toBeInstanceOf(UnprocessableEntityException)
            expect(e.message).toEqual('Organisation has already been added')
          }
        }
      },
      {
        toString: () => "supplier has entry, but it's something else",
        org: '3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
        entries: [
          {
            key: 'org_3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
            value: 'foobar',
            type: 'string'
          }
        ],
        assert: async (serviceFn: () => any) => {
          const res = await serviceFn()
          expect(res).toEqual({ txHashes: ['hash'] })
        }
      }
    ]

    test.each(cases)('%s', async (args) => {
      jest.spyOn(service, 'lib', 'get').mockReturnValue({
        fetchDataWithRegex: () => args.entries
      } as any)

      jest.spyOn(blockchainWriteService, 'broadcast').mockResolvedValue('hash')
      const execute = async () => {
        return await service.addOrganisation(args.org)
      }

      await args.assert(execute)
    })
  })

  describe('organisationsIndex', () => {
    const cases = [
      {
        toString: () => 'basic example',
        entries: [
          {
            key: 'org_3PEfcM3MkYCQAvMknZanC8mM3x9ENvMKpTy',
            value: 'active',
            type: 'string'
          }
        ]
      },
      {
        toString: () => 'empty list',
        entries: []
      }
    ]

    it.each(cases)('%s', async (args) => {
      jest.spyOn(service, 'lib', 'get').mockReturnValue({
        fetchDataWithRegex: () => args.entries
      } as any)

      const res = await service.organisationsIndex()

      expect(res).toEqual(args.entries.map((entry) => entry.key.replace('org_', '')))
    })
  })
})
