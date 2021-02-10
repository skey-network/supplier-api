import { BadRequestException, Injectable } from '@nestjs/common'
import { ConnectionData } from './supplier.interfaces'
import config from '../config'
import fetch, { RequestInit } from 'node-fetch'

const DEVICE_NAME_PREFIX = 'urn:lo:nsid:sms:'
const env = config().supplier

@Injectable()
export class SupplierService {
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

  private async request(path: string, options?: RequestInit) {
    const url = `${env.url}${path}`

    const defaultHeaders = {
      'X-API-KEY': env.apiKey,
      'Content-Type': 'application/json'
    }

    const optionsWithDefaults = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    } as RequestInit

    const res = await fetch(url, optionsWithDefaults)

    return {
      ok: res.ok,
      status: res.status,
      data: { ...res, data: res.status === 204 ? {} : await res.json() }
    }
  }

  private createDevicePayload(args: ConnectionData, secretKey: string) {
    return {
      id: `${DEVICE_NAME_PREFIX}${args.address}`,
      name: args.iccid,
      defaultDataStreamId: args.defaultDataStreamId,
      properties: { secretKey },
      interfaces: [
        {
          connector: 'sms',
          enabled: true,
          definition: {
            msisdn: args.msisdn,
            serverPhoneNumber: args.serverPhoneNumber,
            encoding: 'string'
          },
          activity: {}
        }
      ],
      group: { id: 'root' },
      tags: []
    }
  }
}
