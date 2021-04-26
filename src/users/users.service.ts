import { Injectable } from '@nestjs/common'
import { BlockchainReadService } from '../blockchain/blockchain.read.service'
import { BlockchainWriteService } from '../blockchain/blockchain.write.service'
import config from '../config'
import { CreateUserDto } from './users.model'
import { encrypt } from '../common/aes-encryption'

@Injectable()
export class UsersService {
  constructor(
    private readonly blockchainReadService: BlockchainReadService,
    private readonly blockchainWriteService: BlockchainWriteService
  ) {}

  async create(createUserDto: CreateUserDto) {
    // create blockchain account
    const { address, seed } = this.blockchainReadService.generateAccount()

    // transfer funds from dApp to user
    const amount = config().faucet.user
    await this.blockchainWriteService.faucet(address, amount)

    // save name and description if given
    const data = this.makeEntries(createUserDto)
    data && (await this.blockchainWriteService.insertData(data, seed))

    // return account info
    return { address, encryptedSeed: encrypt(seed) }
  }

  async show(address: string) {
    const promises = [
      this.blockchainReadService.balance(address),
      this.blockchainReadService.readData('name', address),
      this.blockchainReadService.readData('description', address)
    ]

    const [balance, name, description] = await Promise.all(promises)

    return { address, balance, name, description }
  }

  private makeEntries(createUserDto: CreateUserDto) {
    const entries: { key: string; value: string }[] = []

    if (createUserDto.name) {
      entries.push({ key: 'name', value: createUserDto.name })
    }

    if (createUserDto.description) {
      entries.push({ key: 'description', value: createUserDto.description })
    }

    return entries.length === 0 ? null : entries
  }
}
