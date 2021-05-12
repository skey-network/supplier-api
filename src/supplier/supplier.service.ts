import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { ConnectionData } from './supplier.interfaces'
import config from '../config'
import fetch, { RequestInit } from 'node-fetch'
import { CreateKeyDto } from 'src/keys/keys.model'

const DEVICE_NAME_PREFIX = 'urn:lo:nsid:sms:'
const env = config().supplier

@Injectable()
export class SupplierService {
  private logger = new Logger(SupplierService.name)

  async onCreateKeys(createKeyDto: CreateKeyDto, assetIds: string[], tags?: string[]) {
    const path = `/data/streams/${createKeyDto.device}`

    const createPayload = (assetId: string) => ({
      metadata: { source: createKeyDto.device, encoding: 'string' },
      model: 'key',
      value: {
        assetId,
        validTo: createKeyDto.validTo,
        action: createKeyDto.recipient ? 'transfer' : 'activation',
        recipient: createKeyDto.recipient
      },
      timestamp: new Date().toISOString(),
      tags: tags ?? []
    })

    await Promise.all(
      assetIds.map(async (assetId) => {
        try {
          const res = await this.request(path, {
            method: 'POST',
            body: JSON.stringify(createPayload(assetId))
          })

          if (res.status !== 202) {
            this.logger.error(`Cannot send Create Key message to supplier`)
            this.logger.error(res.data.data)

            return
          }

          this.logger.log(`Sent message to supplier ${assetId}`)
        } catch (err) {
          this.logger.error(`Cannot send Create Key message to supplier`)
          this.logger.error(err)
        }
      })
    )
  }

  async connectDevice(connectionData: ConnectionData, secretKey: string) {
    const payload = this.createDevicePayload(connectionData, secretKey)

    const res = await this.request('/deviceMgt/devices', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      throw new BadRequestException({
        status: 'cannot connect device',
        details: res.data
      })
    }

    return res
  }

  async connectionInfo(address: string) {
    const id = `${DEVICE_NAME_PREFIX}${address}`
    const res = await this.request(`/deviceMgt/devices/${id}`, {})

    if (res.ok) return res.data

    throw new BadRequestException({
      status: 'cannot get connection details',
      details: res.data
    })
  }

  async disconnectDevice(address: string) {
    const id = `${DEVICE_NAME_PREFIX}${address}`
    const res = await this.request(`/deviceMgt/devices/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      throw new BadRequestException({
        status: 'cannot disconnect device',
        details: res.data
      })
    }

    return res
  }

  async updateDeviceId(deviceAddress: string, newAddress: string) {
    const fullNewAddress = `${DEVICE_NAME_PREFIX}${newAddress}`

    const res = await this.request(`/deviceMgt/devices/${deviceAddress}`, {
      method: 'PATCH',
      body: JSON.stringify({ id: fullNewAddress })
    })

    if (res.ok) return res

    switch (res.status) {
      case 404:
        throw new NotFoundException()
      default:
        throw new BadRequestException({
          status: 'cannot update device',
          details: res.data
        })
    }
  }

  async updateTransferStatus(address: string, status: boolean) {
    const id = `${DEVICE_NAME_PREFIX}${address}`
    const payload = { properties: { keyTransferred: status } }
    const res = await this.request(`/deviceMgt/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      throw new BadRequestException({
        status: 'cannot change device status',
        details: res.data
      })
    }
  }

  async request(path: string, options?: RequestInit) {
    const url = `${env.url}${path}`

    const defaultHeaders = {
      'X-API-KEY': env.apiKey,
      'Content-Type': 'application/json'
    }

    const optionsWithDefaults = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    } as RequestInit

    try {
      const res = await fetch(url, optionsWithDefaults)

      return {
        ok: res.ok,
        status: res.status,
        data: {
          ...res,
          data: res.status === 204 || res.status === 202 ? {} : await res.json()
        }
      }
    } catch (e) {
      throw new BadRequestException({
        status: 'Failed to reach Supplier API',
        details: e
      })
    }
  }

  private createDevicePayload(args: ConnectionData, secretKey: string) {
    return {
      id: `${DEVICE_NAME_PREFIX}${args.address}`,
      name: args.iccid,
      defaultDataStreamId: args.defaultDataStreamId,
      properties: { secretKey, keyTransferred: false },
      interfaces: [
        {
          connector: 'sms',
          enabled: true,
          definition: {
            msisdn: args.msisdn,
            serverPhoneNumber: args.serverPhoneNumber
          },
          activity: {}
        }
      ],
      group: { id: 'root' },
      tags: []
    }
  }
}
