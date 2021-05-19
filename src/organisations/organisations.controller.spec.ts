import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { OrganisationsController } from './organisations.controller'
import { OrganisationsService } from './organisations.service'
import { BlockchainModule } from '../blockchain/blockchain.module'

describe('OrganisationsController', () => {
  let controller: OrganisationsController
  let service: OrganisationsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainModule],
      controllers: [OrganisationsController],
      providers: [OrganisationsService]
    }).compile()

    controller = module.get<OrganisationsController>(OrganisationsController)
    service = module.get<OrganisationsService>(OrganisationsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('removeKey', () => {
    it('returns array of hashes', async () => {
      const result = { txHashes: ['hash1', 'hash2'] } as any

      jest.spyOn(service, 'removeKey').mockResolvedValue(result)

      expect(await controller.removeKey('org', 'key')).toEqual(result)
    })
  })
})
