import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Admin } from './admins.entity'
import { CreateAdminDto, UpdateAdminDto } from './admins.model'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AdminsService {
  constructor(@InjectRepository(Admin) private adminsRepository: Repository<Admin>) {}

  async findAll() {
    return (await this.adminsRepository.find()).map((admin) => ({
      ...admin,
      passwordHash: undefined
    }))
  }

  async findOne(id: string) {
    const admin = await this.adminsRepository.findOne(id)
    if (admin) return { ...admin, passwordHash: undefined }

    throw new NotFoundException()
  }

  async findByEmail(email: string) {
    return await this.adminsRepository.findOne({ email })
  }

  async remove(id: string) {
    const admin = await this.findOne(id)
    await this.adminsRepository.remove([admin])
  }

  async create(createAdminDto: CreateAdminDto) {
    await this.emailGuard(createAdminDto.email)

    const payload = {
      email: createAdminDto.email,
      passwordHash: await this.hash(createAdminDto.password),
      role: createAdminDto.role
    }

    const admin = this.adminsRepository.create(payload)
    const saved = await this.adminsRepository.save(admin)

    return { ...saved, passwordHash: undefined }
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.findOne(id)

    if (admin.email !== updateAdminDto.email) {
      await this.emailGuard(updateAdminDto.email)
    }

    if (updateAdminDto.email) {
      admin.email = updateAdminDto.email
    }

    if (updateAdminDto.role) {
      admin.role = updateAdminDto.role
    }

    if (updateAdminDto.password) {
      admin.passwordHash = await this.hash(updateAdminDto.password)
    }

    const saved = await this.adminsRepository.save(admin)
    return { ...saved, passwordHash: undefined }
  }

  private async hash(password: string) {
    const rounds = 10
    return await bcrypt.hash(password, rounds)
  }

  private async emailGuard(email: string) {
    const exists = await this.adminsRepository.findOne({ email })
    if (!exists) return

    throw new BadRequestException(['email already exists'])
  }
}
