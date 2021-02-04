import { Test, TestingModule } from '@nestjs/testing'
import { Waves2Service } from './waves2.service'

describe('Waves2Service', () => {
  let service: Waves2Service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Waves2Service]
    }).compile()

    service = module.get<Waves2Service>(Waves2Service)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
