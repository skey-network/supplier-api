import { Injectable, NotFoundException } from '@nestjs/common'
import { WavesReadService } from '../waves/waves.read.service'
import { WavesWriteService } from '../waves/waves.write.service'
import { WavesCompilerService } from '../waves/waves.compiler.service'
import config from '../config'
import { CreateConnectionDto, EditDeviceDto } from './devices.model'
import { OrangeService } from '../orange/orange.service'

@Injectable()
export class DevicesService {
  constructor(
    private readonly wavesReadService: WavesReadService,
    private readonly wavesWriteService: WavesWriteService,
    private readonly wavesCompilerService: WavesCompilerService,
    private readonly orangeService: OrangeService
  ) {}

  private deviceKey(address: string) {
    return `device_${address}`
  }

  async create() {
    // generate new waves account
    const { address, seed } = this.wavesReadService.generateAccount()

    // transfer waves to device account
    const amount = config().faucet.device
    await this.wavesWriteService.faucet(address, amount)

    // set device script
    const script = await this.wavesCompilerService.fetchScript('device')
    await this.wavesWriteService.setScript(script, seed)

    const promises = [
      // save device in dApp data storage
      this.wavesWriteService.insertData([
        { key: this.deviceKey(address), value: false }
      ]),

      // set up device initial data
      this.wavesWriteService.insertData(
        [
          { key: 'dapp', value: config().waves.dappAddress },
          { key: 'owner', value: config().waves.dappAddress }
        ],
        seed
      )
    ]

    // wait for data transactions
    await Promise.all(promises)

    // return account info
    return { address, seed }
  }

  async index() {
    const regex = 'device_.{35}'
    const data = await this.wavesReadService.fetchWithRegex(regex)
    return data.map((item: any) => item.key.replace('device_', ''))
  }

  async show(address: string) {
    const { dappAddress } = config().waves

    const promises = [
      this.deviceExists(address),
      this.wavesReadService.balance(address)
    ]

    const [connected, balance] = await Promise.all(promises)

    return {
      ownerDapp: dappAddress,
      address,
      balance,
      connected
    }
  }

  async destroy(address: string) {
    await this.deviceExists(address)

    // remove device address from dApp
    const txHash = await this.wavesWriteService.insertData([
      { key: this.deviceKey(address), value: undefined }
    ])

    return { txHash }
  }

  async edit(address: string, editDeviceDto: EditDeviceDto) {
    const entries = Object.entries(editDeviceDto).map(([key, value]) => ({
      value: value === null ? undefined : value,
      key
    }))

    const txHash = await this.wavesWriteService.updateDeviceData(
      address,
      entries
    )
    return { txHash }
  }

  async connect(address: string, data: CreateConnectionDto) {
    await this.deviceExists(address)

    const payload = { ...data, address }
    const secret = this.wavesReadService.randomString()
    const res = await this.orangeService.connectDevice(payload, secret)

    if (res.ok) {
      await this.wavesWriteService.insertData([
        { key: this.deviceKey(address), value: true }
      ])
      return { status: 'device connected', details: res.data }
    }
  }

  async disconnect(address: string) {
    await this.deviceExists(address)

    const res = await this.orangeService.disconnectDevice(address)

    if (res.ok) {
      await this.wavesWriteService.insertData([
        { key: this.deviceKey(address), value: false }
      ])
      return { status: 'device disconnected', details: res.data }
    }
  }

  async connection(address: string) {
    await this.deviceExists(address)
    const res = await this.orangeService.connectionInfo(address)
    return { status: 'connection details', details: res.data }
  }

  private async deviceExists(address: string) {
    const connected = await this.wavesReadService.readData(
      this.deviceKey(address)
    )

    if (connected === undefined) {
      throw new NotFoundException()
    }

    return connected
  }
}
