import { config as configure } from 'dotenv'
configure()

import * as Transactions from '@waves/waves-transactions'
import * as Crypto from '@waves/ts-lib-crypto'
import * as chalk from 'chalk'

const wvs = 10 ** 8

describe('setup', () => {
  it('creates account with funds', async () => {
    const genesis = 'waves private node seed with waves tokens'
    const seed = Crypto.randomSeed(15)
    const address = Crypto.address(seed, 'R')
    const nodeUrl = 'http://192.168.99.101:6869'

    const params: Transactions.ITransferParams = {
      recipient: address,
      amount: 10000 * wvs
    }

    const payload = Transactions.transfer(params, genesis)
    const tx = await Transactions.broadcast(payload, nodeUrl)
    await Transactions.waitForTx(tx.id, { apiBase: nodeUrl })

    const spacing = Array(seed.length).fill('=').join('')
    console.log(`${spacing}\n${chalk.green(seed)}\n${spacing}`)
  })
})
