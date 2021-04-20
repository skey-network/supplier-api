import { config as configure } from 'dotenv'
configure()

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import config from '../config'

jest.setTimeout(3600000)

// ===============================================
// Make sure you have enough tokens before testing
// ===============================================

describe('admins controller', () => {
  let app: INestApplication
  let req: () => request.SuperTest<request.Test>

  let ctx = {
    superadmin: {
      ...config().admin,
      token: ''
    },
    admin: {
      email: 'admin@test.pl',
      password: 'admin123123',
      token: '',
      id: '',
      role: 'admin'
    },
    editor: {
      email: 'editor@test.pl',
      password: 'editor123123',
      token: '',
      id: '',
      role: 'editor'
    },
    tester: {
      email: 'tester@test.pl',
      password: 'waka waka e e',
      token: '',
      id: '',
      role: 'admin'
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())

    await app.init()

    req = () => request(app.getHttpServer())
  })

  describe('POST /auth/login', () => {
    it('admin user can log in', async () => {
      const res = await req().post('/auth/login').send(config().admin).expect(201)

      expect(res.body.access_token).toBeDefined()
      ctx.superadmin.token = res.body.access_token
    })
  })

  describe('POST /admins', () => {
    it('creates admin user', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .send(ctx.admin)
        .expect(201)

      ctx.admin.id = res.body.id
    })

    it('creates editor user', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .send(ctx.editor)
        .expect(201)

      ctx.editor.id = res.body.id
    })

    it('creates tester user', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .send(ctx.tester)
        .expect(201)

      ctx.tester.id = res.body.id
    })
  })

  describe('POST /auth/login', () => {
    it('logs in as admin', async () => {
      const res = await req().post('/auth/login').send(ctx.admin).expect(201)

      expect(res.body.access_token).toBeDefined()
      ctx.admin.token = res.body.access_token
    })

    it('logs in as editor', async () => {
      const res = await req().post('/auth/login').send(ctx.editor).expect(201)

      expect(res.body.access_token).toBeDefined()
      ctx.editor.token = res.body.access_token
    })
  })

  describe('POST /admins', () => {
    it('editor cannot create users', async () => {
      await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.editor.token}`)
        .send({
          email: 'parowka32@wp.pl',
          password: 'aaaaaaaaa',
          role: 'admin'
        })
        .expect(403)
    })

    it('password too weak', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({
          email: 'parowka32@wp.pl',
          password: 'aa',
          role: 'editor'
        })
        .expect(400)

      expect(res.body.message[0].includes('password')).toBe(true)
    })

    it('invalid role', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({
          email: 'parowka32@wp.pl',
          password: 'aaaaaaaaa',
          role: 'jedi'
        })
        .expect(400)

      expect(res.body.message[0].includes('role')).toBe(true)
    })

    it('invalid email', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({
          email: 'obiwan',
          password: 'aaaaaaaaa',
          role: 'admin'
        })
        .expect(400)

      expect(res.body.message[0].includes('email')).toBe(true)
    })

    it('email taken', async () => {
      const res = await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({
          email: 'admin@test.pl',
          password: 'aaaaaaaaa',
          role: 'admin'
        })
        .expect(400)

      expect(res.body.message[0].includes('email')).toBe(true)
    })

    it('empty values', async () => {
      await req()
        .post('/admins')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .expect(400)
    })

    it('no token', async () => {
      const res = await req()
        .post('/admins')
        .send({
          email: 'parowka32@wp.pl',
          password: 'aaaaaaaa',
          role: 'editor'
        })
        .expect(401)
    })
  })

  describe('GET /admins', () => {
    it('lists users', async () => {
      const res = await req()
        .get('/admins')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .expect(200)

      expect(res.body.find((user) => user.email === ctx.admin.email)).toBeDefined()
      expect(res.body.find((user) => user.email === ctx.editor.email)).toBeDefined()

      expect(res.body[0].passwordHash).toBeUndefined()
    })

    it('editor cannot list users', async () => {
      await req()
        .get('/admins')
        .set('Authorization', `Bearer ${ctx.editor.token}`)
        .expect(403)
    })

    it('no token', async () => {
      await req().get('/admins').expect(401)
    })
  })

  describe('GET /admins/:id', () => {
    it('shows user', async () => {
      const res = await req()
        .get(`/admins/${ctx.editor.id}`)
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .expect(200)

      expect(res.body.id).toBe(ctx.editor.id)
      expect(res.body.email).toBe(ctx.editor.email)
      expect(res.body.role).toBe('editor')
      expect(res.body.passwordHash).toBeUndefined()
    })

    it('editor cannot get user', async () => {
      await req()
        .get(`/admins/${ctx.admin.id}`)
        .set('Authorization', `Bearer ${ctx.editor.token}`)
        .expect(403)
    })

    it('not found', async () => {
      await req()
        .get('/admins/fghghgh')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .expect(404)
    })

    it('no token', async () => {
      await req().get('/admins/fghghgh').expect(401)
    })
  })

  describe('PUT /admins/:id', () => {
    it('updates password', async () => {
      await req()
        .put(`/admins/${ctx.tester.id}`)
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({ password: '123123123123' })
        .expect(200)
    })

    it('updates email', async () => {
      await req()
        .put(`/admins/${ctx.tester.id}`)
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({ email: 'tester123@test.pl' })
        .expect(200)
    })

    it('updates role', async () => {
      await req()
        .put(`/admins/${ctx.tester.id}`)
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({ role: 'editor' })
        .expect(200)
    })

    it('editor cannot update', async () => {
      await req()
        .put(`/admins/${ctx.tester.id}`)
        .set('Authorization', `Bearer ${ctx.editor.token}`)
        .send({ role: 'admin' })
        .expect(403)
    })

    it('not found', async () => {
      await req()
        .put('/admins/gfdgdfgdsg')
        .set('Authorization', `Bearer ${ctx.admin.token}`)
        .send({ role: 'admin' })
        .expect(404)
    })

    it('no token', async () => {
      await req().put('/admins/gfdgdfgdsg').expect(401)
    })
  })

  describe('DELETE /admins/:id', () => {
    it('editor cannot delete user', async () => {
      await req()
        .delete(`/admins/${ctx.tester.id}`)
        .set('Authorization', `Bearer ${ctx.editor.token}`)
        .expect(403)
    })

    it('deletes admin user', async () => {
      await req()
        .delete(`/admins/${ctx.admin.id}`)
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .expect(200)
    })

    it('deletes editor user', async () => {
      await req()
        .delete(`/admins/${ctx.editor.id}`)
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .expect(200)
    })

    it('deletes tester user', async () => {
      await req()
        .delete(`/admins/${ctx.tester.id}`)
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .expect(200)
    })

    it('not found', async () => {
      await req()
        .delete('/admins/dfkdfg')
        .set('Authorization', `Bearer ${ctx.superadmin.token}`)
        .expect(404)
    })

    it('no token', async () => {
      await req().delete('/admins/dfkdfg').expect(401)
    })
  })
})
