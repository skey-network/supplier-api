import { Injectable, NotFoundException } from '@nestjs/common'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import { BlockchainCompilerService } from '../blockchain/blockchain.compiler.service'
import config from '../config'
import {
  CreateDeviceDto,
  EditDeviceDto,
  CreateConnectionDto
} from './devices.model'
import { SupplierService } from '../supplier/supplier.service'

@Injectable()
export class DevicesService {
  constructor(
    private readonly blockchainReadService: BlockchainReadService,
    private readonly blockchainWriteService: BlockchainWriteService,
    private readonly blockchainCompilerService: BlockchainCompilerService,
    private readonly supplierService: SupplierService
  ) {}

  private deviceKey(address: string) {
    return `device_${address}`
  }

  async create(createDeviceDto: CreateDeviceDto) {
    // generate new blockchain account
    const { address, seed } = this.blockchainReadService.generateAccount()

    // transfer blockchain to device account
    const amount = config().faucet.device
    await this.blockchainWriteService.faucet(address, amount)

    // set device script
    const script = await this.blockchainCompilerService.fetchScript('device')
    await this.blockchainWriteService.setScript(script, seed)

    const promises = [
      // save device in dApp data storage
      this.blockchainWriteService.insertData([
        { key: this.deviceKey(address), value: false }
      ]),

      // set up device initial data
      this.blockchainWriteService.insertData(
        this.entriesForNewDevice(createDeviceDto),
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
    const data = await this.blockchainReadService.fetchWithRegex(regex)
    return data.map((item: any) => item.key.replace('device_', ''))
  }

  async show(address: string) {
    const { dappAddress } = config().blockchain

    const promises = [
      this.deviceExists(address),
      this.blockchainReadService.balance(address)
    ]

    const [connected, balance] = await Promise.all(promises)

    return {
      ownerDapp: dappAddress,
      address,
      balance,
      connected
    }
  }

  async addKey(address: string, assetId: string) {
    const txHash = await this.blockchainWriteService.addKeyToDevice(
      assetId,
      address
    )

    return { txHash }
  }

  async removeKey(address: string, assetId: string) {
    const txHash = await this.blockchainWriteService.removeKeyFromDevice(
      assetId,
      address
    )

    return { txHash }
  }

  async destroy(address: string) {
    await this.deviceExists(address)

    // remove device address from dApp
    const txHash = await this.blockchainWriteService.insertData([
      { key: this.deviceKey(address), value: undefined }
    ])

    return { txHash }
  }

  async edit(address: string, editDeviceDto: EditDeviceDto) {
    const entries = Object.entries(editDeviceDto).map(([key, value]) => ({
      value: value === null ? undefined : value,
      key
    }))

    const txHash = await this.blockchainWriteService.updateDeviceData(
      address,
      entries
    )
    return { txHash }
  }

  async connect(address: string, data: CreateConnectionDto) {
    await this.deviceExists(address)

    const payload = { ...data, address }
    const secret = this.blockchainReadService.randomString()
    const res = await this.supplierService.connectDevice(payload, secret)

    if (res.ok) {
      return { status: 'device connected', details: res.data }
    }
  }

  async disconnect(address: string) {
    await this.deviceExists(address)

    const res = await this.supplierService.disconnectDevice(address)

    if (res.ok) {
      return { status: 'device disconnected', details: res.data }
    }
  }

  async connection(address: string) {
    await this.deviceExists(address)
    const res = await this.supplierService.connectionInfo(address)
    return { status: 'connection details', details: res.data }
  }

  private async deviceExists(address: string) {
    const connected = await this.blockchainReadService.readData(
      this.deviceKey(address)
    )

    if (connected === undefined) {
      throw new NotFoundException()
    }

    return connected
  }

  private entriesForNewDevice = (payload: CreateDeviceDto) => {
    const entries = Object.entries(payload).map(([key, value]) => ({
      value: typeof value === 'number' ? value.toString() : value,
      key
    }))

    const dappEntries = [
      { key: 'dapp', value: config().blockchain.dappAddress },
      { key: 'owner', value: config().blockchain.dappAddress }
    ]

    return [...entries, ...dappEntries]
  }
}
