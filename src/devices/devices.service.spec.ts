import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { DevicesService } from './devices.service'
import { BlockchainModule } from '../blockchain/blockchain.module'
import { SupplierService } from '../supplier/supplier.service'

interface Entry {
  key: string
  value: string | number | boolean | undefined
}

describe('devices service', () => {
  let module: TestingModule
  let service: DevicesService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [BlockchainModule],
      providers: [
        DevicesService,
        {
          // mocking SupplierService to avoid hitting suppliers' API
          provide: SupplierService,
          useValue: {
            connectDevice: (_payload, _secret) => {
              ok: true
            },
            disconnectDevice: (_address) => {
              ok: true
            },
            connectionInfo: (_address) => {
              ok: true
            },
            updateDeviceId: (_deviceId, _address) => {
              data: {
                foo: 'bar'
              }
            }
          }
        }
      ]
    }).compile()

    service = module.get<DevicesService>(DevicesService)
  })

  afterAll(async () => {
    await module.close()
  })

  describe('parseLocation', () => {
    it('correct location', () => {
      const payload =
        '2021/03/19 10:06:22 Lon:20.518440 Lat:53.786247 External Voltage Val:8262'
      const { lat, lng } = service.parseLocation(payload)

      expect(lat).toBe('53.786247')
      expect(lng).toBe('20.518440')
    })

    it('location not found', () => {
      const payload = 'DOUT1:1 Timeout:1s'
      const { lat, lng } = service.parseLocation(payload)

      expect(lat).toBeUndefined()
      expect(lng).toBeUndefined()
    })

    it('payload is undefined', () => {
      const { lat, lng } = service.parseLocation(undefined)

      expect(lat).toBeUndefined()
      expect(lng).toBeUndefined()
    })
  })

  describe('deviceMessage', () => {
    it('works', async () => {
      const address = '3P2pTpQhGbZrJXATKr75A1uZjeTrb4PHMYf'

      service.parseLocation = () => ({ lat: '20', lng: '50' })
      ;(service as any).blockchainWriteService.updateDeviceData = async (
        device: string,
        entries: Entry[]
      ) => {
        expect(device).toBe(address)
        expect(entries).toContainEqual({ key: 'lat', value: '20' })
        expect(entries).toContainEqual({ key: 'lng', value: '50' })

        return 'aaa'
      }

      const message = {
        timestamp: '2021-03-19T10:06:34Z',
        payload: '',
        source: `urn:lo:nsid:blockchain:${address}`
      }

      const { txHash } = await service.deviceMessage(message)
      expect(txHash).toBe('aaa')
    })

    it('does not send tx when no location', async () => {
      const address = '3P2pTpQhGbZrJXATKr75A1uZjeTrb4PHMYf'
      service.parseLocation = () => ({})

      const message = {
        timestamp: '2021-03-19T10:06:34Z',
        payload: '',
        source: `urn:lo:nsid:blockchain:${address}`
      }

      const obj = await service.deviceMessage(message)
      expect(Object.keys(obj).length).toBe(0)
    })

    it('throws error when invalid address', async () => {
      expect(
        service.deviceMessage({ source: 'aaa', payload: '', timestamp: '' })
      ).rejects.toBeDefined()
    })
  })
})
