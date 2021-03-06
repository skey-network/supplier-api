import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { SupplierService } from './supplier.service'

describe('SupplierService', () => {
  let moduleFixture: TestingModule
  let service: SupplierService

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      providers: [SupplierService]
    }).compile()

    service = moduleFixture.get<SupplierService>(SupplierService)
  })

  afterAll(async () => {
    await moduleFixture.close()
  })

  describe('onCreateKeys', () => {
    let spy: jest.SpyInstance

    beforeEach(() => {
      spy = jest.spyOn(service, 'request').mockResolvedValue({
        status: 202,
        data: {}
      } as any)
    })

    const cases = [
      {
        toString: () => 'basic example',
        createKeyDto: {
          device: 'device',
          validTo: 9999,
          amount: 2,
          recipient: 'recipient'
        },
        assetIds: ['assetId'],
        tags: ['t1', 't2'],
        expectedPayload: {
          metadata: { source: 'device', encoding: 'string' },
          model: 'key',
          value: {
            assetId: 'assetId',
            validTo: 9999,
            action: 'transfer',
            recipient: 'recipient'
          },
          tags: ['t1', 't2']
        },
        expectedPath: '/data/streams/device'
      }
    ]

    test.each(cases)('%s', async (args) => {
      await service.onCreateKeys(args.createKeyDto, args.assetIds, args.tags)

      const [path, options] = spy.mock.calls[0]

      expect(path).toBe(args.expectedPath)
      expect(options.method).toBe('POST')

      const parsed = JSON.parse(options.body)

      expect({ ...parsed, value: { ...parsed.value, timestamp: undefined } }).toEqual(
        args.expectedPayload
      )

      expect(parsed.value.timestamp).toBeDefined()
    })
  })
})
