import { BadRequestException, Injectable } from '@nestjs/common'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'
import fetch from 'node-fetch'

const { nodeUrl, seed, chainId, dappAddress } = config().blockchain

@Injectable()
export class BlockchainReadService {
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

  async fetchWithRegex(exp: string, address = Crypto.address(seed, chainId)) {
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

  async fetchScript(address = Crypto.address(seed, chainId)) {
    const res = await this.request(`/addresses/scriptInfo/${address}`)
    return res
  }

  async fetchNFTs(limit: number, after?: string | undefined, address = dappAddress) {
    const afterParam = after ? `after=${after}` : ''
    const path = `/assets/nft/${address}/limit/${limit}?${afterParam}`
    const res = await this.request(path)
    return res
  }

  async fetchAllNFTs(address: string, limit = 1000) {
    const MAX_REQUESTS = 15

    let all: any[] = []
    let after: string | undefined

    for (const index in Array(MAX_REQUESTS).fill(null)) {
      const tokens = await this.fetchNFTs(limit, after, address)

      all = [...all, ...tokens]

      if (tokens.length > 0) {
        after = tokens[tokens.length - 1].assetId
      }

      if (tokens.length < limit) break

      if (Number(index) - 1 === MAX_REQUESTS) {
        throw new Error('Max amount of requests reached')
      }
    }

    return all
  }

  async fetchAliases(address: string) {
    const res = await this.request(`/alias/by-address/${address}`)
    return res;
  }

  async fetchDAppAliases() {
    return await this.fetchAliases(dappAddress);
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
