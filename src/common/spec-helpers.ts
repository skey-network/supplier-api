import * as request from 'supertest'

export const createTestDevice = async (
  req: () => request.SuperTest<request.Test>,
  token: string
): Promise<{ address: string; encryptedSeed: string }> => {
  const res = await req()
    .post('/devices')
    .send({
      name: 'testDevice'
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(201)

  return res.body
}
