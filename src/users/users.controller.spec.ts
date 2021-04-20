import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('users controller', () => {
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>
  let token = ''

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())

    const tokenRequest = await req().post('/auth/login').send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    })
    token = tokenRequest.body.access_token
  })

  describe('POST /users', () => {
    it('valid request', async () => {
      const res = await req()
        .post('/users')
        .send({ name: 'a', description: 'b' })
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      const { address, seed } = res.body

      expect(typeof address).toBe('string')
      expect(typeof seed).toBe('string')
    })

    it('invalid data', async () => {
      const res = await req()
        .post('/users')
        .send({ name: 13, description: {} })
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('name must be a string')).toBe(true)
      expect(res.body.message.includes('description must be a string')).toBe(true)
    })

    it('unauthorized', async () => {
      await req().post('/users').expect(401)
    })

    it('invalid token', async () => {
      await req()
        .post('/users')
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })
  })

  describe('GET /users/:address', () => {
    let user = ''

    beforeAll(async () => {
      const res = await req().post('/users').set('Authorization', `Bearer ${token}`)

      user = res.body.address
    })

    it('valid request', async () => {
      const res = await req()
        .get(`/users/${user}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toBeInstanceOf(Object)
      expect(typeof res.body.address).toBe('string')
      expect(typeof res.body.balance).toBe('number')
      expect(res.body.balance).toBeGreaterThanOrEqual(0)
    })

    it('unauthorized', async () => {
      await req().get(`/users/${user}`).expect(401)
    })

    it('invalid token', async () => {
      await req()
        .get(`/users/${user}`)
        .set('Authorization', 'Bearer jg8g0uhrtiughertkghdfjklhgiou64hg903hgji')
        .expect(401)
    })

    it('invalid address', async () => {
      const res = await req()
        .get('/users/hello')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(res.body.message.includes('address is not valid')).toBe(true)
    })
  })
})
