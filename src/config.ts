import * as Crypto from '@waves/ts-lib-crypto'

export default () => ({
  logs: process.env.ENABLE_LOGS === 'true',
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    validTime: process.env.JWT_VALID_TIME ?? '24h'
  },
  blockchain: {
    seed: process.env.BLOCKCHAIN_SEED,
    dappAddress: Crypto.address(
      process.env.BLOCKCHAIN_SEED,
      process.env.BLOCKCHAIN_CHAIN_ID
    ),
    nodeUrl: process.env.BLOCKCHAIN_NODE_URL,
    chainId: process.env.BLOCKCHAIN_CHAIN_ID
  },
  supplier: {
    apiKey: process.env.SUPPLIER_API_KEY,
    url: process.env.SUPPLIER_URL
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
