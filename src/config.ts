import * as Crypto from '@waves/ts-lib-crypto'

export default () => ({
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    validTime: process.env.JWT_VALID_TIME ?? '24h'
  },
  waves: {
    seed: process.env.WAVES_SEED,
    dappAddress: Crypto.address(
      process.env.WAVES_SEED,
      process.env.WAVES_CHAIN_ID
    ),
    nodeUrl: process.env.WAVES_NODE_URL,
    chainId: process.env.WAVES_CHAIN_ID
  },
  orange: {
    apiKey: process.env.ORANGE_API_KEY,
    url: process.env.ORANGE_URL
  },
  faucet: {
    device: Number(process.env.FAUCET_DEVICE ?? '1000000'),
    user: Number(process.env.FAUCET_USER ?? '1000000')
  },
  key: {
    minDuration: Number(process.env.KEY_MIN_DURATION ?? '3600000'),
    maxAmount: Number(process.env.KEY_MAX_AMOUNT ?? '50')
  }
})
