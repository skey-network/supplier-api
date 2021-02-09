import { BadRequestException, Injectable } from '@nestjs/common'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'
import fetch from 'node-fetch'

const { nodeUrl, seed, chainId, dappAddress } = config().waves

@Injectable()
export class WavesReadService {
  randomString() {
    return Crypto.privateKey(Crypto.randomSeed(15))
  }

  generateAccount() {
    const seed = Crypto.randomSeed(15)
    return { seed, address: Crypto.address(seed, chainId) }
  }

  async readData(key: string, address = dappAddress) {
    const res = await this.request(`/addresses/data/${address}/${key}`)
    return res.value
  }

  async fetchWithRegex(exp: string) {
    const address = Crypto.address(seed, chainId)
    const path = `/addresses/data/${address}?matches=${encodeURI(exp)}`
    return await this.request(path)
  }

  async balance(address: string) {
    const res = await this.request(`/addresses/balance/${address}`)
    return res.balance
  }

  async assetBalance(address: string, asset: string) {
    const res = await this.request(`/assets/balance/${address}/${asset}`)
    return res.balance as number
  }

  async fetchAsset(assetId: string) {
    const res = await this.request(`/assets/details/${assetId}`)
    return res
  }

  async fetchNFTs(limit: number, after?: string) {
    const afterParam = after ? `after=${after}` : ''
    const path = `/assets/nft/${dappAddress}/limit/${limit}?${afterParam}`
    const res = await this.request(path)
    return res
  }

  private async request(path: string) {
    try {
      const res = await fetch(`${nodeUrl}${path}`)
      return await res.json()
    } catch (err) {
      throw new BadRequestException({
        message: 'failed to fetch data from blockchain',
        details: err
      })
    }
  }
}
