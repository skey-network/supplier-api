import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import { getInstance } from 'skey-lib'
import config from '../config'

const { chainId, nodeUrl, dappAddress, seed } = config().blockchain

@Injectable()
export class OrganisationsService {
  constructor(private readonly blockchainWriteService: BlockchainWriteService) {}

  get lib() {
    return getInstance({ nodeUrl, chainId }) as any
  }

  async removeKey(organisationAddress: string, keyAssetId: string) {
    const [key, organisationEntries] = await Promise.all([
      this.lib.fetchKey(keyAssetId),
      this.lib.fetchDataWithRegex(`org_${organisationAddress}`, dappAddress)
    ])

    this.handleNotFound(key, organisationEntries)

    const { device } = this.lib.extractValuesFromKey(key?.description)

    const txHashes = await Promise.all([
      this.blockchainWriteService.burnKeyOnOrganisation(organisationAddress, keyAssetId),
      this.blockchainWriteService.removeKeyFromDevice(keyAssetId, device)
    ])

    return { txHashes }
  }

  async addOrganisation(address: string) {
    const entries: Entry[] = await this.lib.fetchDataWithRegex(
      `org_${address}`,
      dappAddress
    )

    if (entries.length > 0) {
      const entry: Entry = entries[0]
      if (entry.value === 'active') {
        throw new UnprocessableEntityException('Organisation has already been added')
      }
    }

    const orgEntry: StringEntry = {
      key: `org_${address}`,
      value: 'active',
      type: 'string'
    }

    const txHashes = await Promise.all([
      this.blockchainWriteService.insertData([orgEntry])
    ])

    return { txHashes }
  }

  handleNotFound(key: any, entries: Entry[]) {
    if (!entries.length) {
      throw new NotFoundException('organisation not found')
    }

    if (key?.issuer !== dappAddress) {
      throw new NotFoundException('key not found')
    }
  }
}
