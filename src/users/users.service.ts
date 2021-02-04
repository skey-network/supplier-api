import { Injectable } from '@nestjs/common'
import { WavesReadService } from '../waves/waves.read.service'
import { WavesWriteService } from '../waves/waves.write.service'
import config from '../config'
import { CreateUserDto } from './users.model'

@Injectable()
export class UsersService {
  constructor(
    private readonly wavesReadService: WavesReadService,
    private readonly wavesWriteService: WavesWriteService
  ) {}

  async create(createUserDto: CreateUserDto) {
    // create waves account
    const { address, seed } = this.wavesReadService.generateAccount()

    // transfer funds from dApp to user
    const amount = config().faucet.user
    await this.wavesWriteService.faucet(address, amount)

    // save name and description if given
    const data = this.makeEntries(createUserDto)
    data && (await this.wavesWriteService.insertData(data, seed))

    // return account info
    return { address, seed }
  }

  async show(address: string) {
    const promises = [
      this.wavesReadService.balance(address),
      this.wavesReadService.readData('name', address),
      this.wavesReadService.readData('description', address)
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
