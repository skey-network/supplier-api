import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { OrganisationsController } from './organisations.controller'
import { OrganisationsService } from './organisations.service'
import { BlockchainModule } from '../blockchain/blockchain.module'

describe('OrganisationsController', () => {
  let moduleFixture: TestingModule
  let controller: OrganisationsController
  let service: OrganisationsService

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [BlockchainModule],
      controllers: [OrganisationsController],
      providers: [OrganisationsService]
    }).compile()

    controller = moduleFixture.get<OrganisationsController>(OrganisationsController)
    service = moduleFixture.get<OrganisationsService>(OrganisationsService)
  })

  afterAll(async () => {
    await moduleFixture.close()
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

  describe('addOrganisation', () => {
    it('returns array with hash', async () => {
      const result = { txHashes: ['hash'] }

      jest.spyOn(service, 'addOrganisation').mockResolvedValue(result)

      expect(
        await controller.addOrganisation('3MPrus28cW4x6XePSF3Fb1eMHSfUsirZ4a5')
      ).toEqual(result)
    })
  })

  describe('organisationsIndex', () => {
    it('returns addresses array', async () => {
      const result = ['foo', 'bar', 'baz']

      jest.spyOn(service, 'organisationsIndex').mockResolvedValue(result)

      expect(await controller.organisationsIndex()).toEqual(result)
    })
  })
})
