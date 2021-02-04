import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { UtilsController } from './utils.controller'
import { WavesModule } from '../waves/waves.module'
import { UtilsService } from './utils.service'

describe('UtilsController', () => {
  let controller: UtilsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WavesModule],
      controllers: [UtilsController],
      providers: [UtilsService]
    }).compile()

    controller = module.get<UtilsController>(UtilsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
