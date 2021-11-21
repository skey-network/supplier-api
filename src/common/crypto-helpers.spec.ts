import { publicKeyToAddress } from './crypto-helpers'

describe('publicKeyToAddress', () => {
  it('properly converts address', () => {
    expect(
      publicKeyToAddress('HBqhfdFASRQ5eBBpu2y6c6KKi1az6bMx8v1JxX4iW1Q8', 'W')
    ).toEqual('3PPbMwqLtwBGcJrTA5whqJfY95GqnNnFMDX')
  })
})
