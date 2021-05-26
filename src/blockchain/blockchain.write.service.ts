import { BadRequestException, Injectable } from '@nestjs/common'
import * as Transactions from '@waves/waves-transactions'
import { IInvokeScriptCallStringArgument } from '@waves/waves-transactions/dist/transactions'
import { Logger } from '../logger/Logger.service'
import config from '../config'
import { BlockchainReadService } from './blockchain.read.service'
import * as Crypto from '@waves/ts-lib-crypto'

const { nodeUrl, seed, chainId, dappAddress } = config().blockchain
const feeMultiplier = 10 ** 5

interface Entry {
  key: string
  value: string | number | boolean | undefined
}

@Injectable()
export class BlockchainWriteService {
  private logger = new Logger(BlockchainWriteService.name)
  private blockchainReadService = new BlockchainReadService()

  // save data in dApp data storage
  async insertData(data: Entry[], accountSeed = seed) {
    const params: Transactions.IDataParams = {
      data: data,
      fee: 5 * feeMultiplier,
      chainId
    }

    const tx = Transactions.data(params, accountSeed)
    return await this.broadcast(tx)
  }

  // change name of a key in key/value storage
  async renameDataKey(oldKey: string, newKey: string, accountSeed = seed) {
    // read data from blockchain
    const oldValue = await this.blockchainReadService.readData(
      oldKey,
      Crypto.address(accountSeed, chainId)
    )

    if (!oldValue) {
      throw new Error(`No data found in key '${oldKey}'. Maybe a spelling error?`)
    }

    // create the transaction
    const replaceParams = {
      data: [
        { key: oldKey, value: null },
        { key: newKey, value: oldValue }
      ],
      fee: 5 * feeMultiplier,
      chainId
    }

    const rTx = Transactions.data(replaceParams, accountSeed)
    return await this.broadcast(rTx)
  }

  // generate NFT key for device
  async generateKey(address: string, validTo: number) {
    const params: Transactions.IIssueParams = {
      name: 'SmartKey',
      description: `${address}_${validTo}`,
      reissuable: false,
      quantity: 1,
      decimals: 0,
      chainId,
      fee: 5 * feeMultiplier
    }

    const tx = Transactions.issue(params, seed)
    return await this.broadcast(tx)
  }

  // generate n amount of NTF keys for device
  async generateNKeys(address: string, validTo: number, amount: number) {
    const arr = Array(amount).fill(null)
    const promises = arr.map(() => this.generateKey(address, validTo))
    return await Promise.all(promises)
  }

  // transfer NFT key from dApp to address
  async transfer(address: string, assetId: string) {
    const params: Transactions.ITransferParams = {
      recipient: address,
      amount: 1,
      assetId,
      fee: 5 * feeMultiplier,
      chainId
    }

    const tx = Transactions.transfer(params, seed)
    return await this.broadcast(tx)
  }

  // transfer funds from dApp to address
  async faucet(address: string, amount: number) {
    const params: Transactions.ITransferParams = {
      recipient: address,
      fee: 5 * feeMultiplier,
      chainId,
      amount
    }

    const tx = Transactions.transfer(params, seed)
    return await this.broadcast(tx)
  }

  // set script on address
  async setScript(script: string, seed: string) {
    const params: Transactions.ISetScriptParams = {
      fee: 14 * feeMultiplier,
      script,
      chainId
    }

    const tx = Transactions.setScript(params, seed)
    return await this.broadcast(tx)
  }

  // add key to device data storage
  async addKeyToDevice(assetId: string, device: string) {
    const params: Transactions.IInvokeScriptParams = {
      dApp: device,
      call: {
        function: 'addKey',
        args: [{ type: 'string', value: assetId }]
      },
      chainId,
      fee: 9 * feeMultiplier
    }

    const tx = Transactions.invokeScript(params, seed)
    return await this.broadcast(tx)
  }

  // add multiple keys to device data storage
  async addNKeysToDevice(assetIds: string[], device: string) {
    const entries = assetIds.map((id) => ({
      type: 'string',
      value: id
    })) as IInvokeScriptCallStringArgument[]

    const params: Transactions.IInvokeScriptParams = {
      dApp: device,
      call: {
        function: 'addManyKeys',
        args: [{ type: 'list', value: entries }]
      },
      chainId,
      fee: 9 * feeMultiplier
    }

    const tx = Transactions.invokeScript(params, seed)
    return await this.broadcast(tx)
  }

  // remove key from device data storage
  async removeKeyFromDevice(assetId: string, device: string) {
    const params: Transactions.IInvokeScriptParams = {
      dApp: device,
      call: {
        function: 'removeKey',
        args: [{ type: 'string', value: assetId }]
      },
      chainId,
      fee: 9 * feeMultiplier
    }

    const tx = Transactions.invokeScript(params, seed)
    return await this.broadcast(tx)
  }

  // update data storage on device
  async updateDeviceData(device: string, entries: Entry[]) {
    const parsedEntries = this.parseEntries(entries)

    const params: Transactions.IInvokeScriptParams = {
      dApp: device,
      call: {
        function: 'updateData',
        args: [{ type: 'list', value: parsedEntries }]
      },
      chainId,
      fee: 9 * feeMultiplier
    }

    const tx = Transactions.invokeScript(params, seed)
    return await this.broadcast(tx)
  }

  // Burn key if is on dApp account
  async burnKey(assetId: string) {
    const params: Transactions.IBurnParams = {
      assetId,
      amount: 1,
      chainId,
      fee: 5 * feeMultiplier
    }

    const tx = Transactions.burn(params, seed)
    return await this.broadcast(tx)
  }

  // Burn key with organisation dapp script
  async burnKeyOnOrganisation(organisation: string, key: string) {
    const params: Transactions.IInvokeScriptParams = {
      dApp: organisation,
      call: {
        function: 'removeKey',
        args: [{ type: 'string', value: key }]
      },
      fee: 9 * 10 ** 5,
      chainId
    }

    const tx = Transactions.invokeScript(params, seed)
    return await this.broadcast(tx)
  }

  // Interact with device via key, ex open
  async interactWithDevice(action: string, key: string, seed: string) {
    const params: Transactions.IInvokeScriptParams = {
      dApp: dappAddress,
      call: {
        function: 'deviceAction',
        args: [
          { type: 'string', value: key },
          { type: 'string', value: action }
        ]
      },
      chainId,
      fee: 9 * feeMultiplier
    }

    const tx = Transactions.invokeScript(params, seed)
    return await this.broadcast(tx)
  }

  // Set an alias to dApp
  async setAlias(alias: string, seed: string) {
    const params: Transactions.IAliasParams = {
      alias: alias,
      chainId,
      fee: 5 * feeMultiplier
    }

    const tx = Transactions.alias(params, seed)
    return await this.broadcast(tx)
  }

  async setDAppAlias(alias: string) {
    return await this.setAlias(alias, seed)
  }

  private parseEntries(entries: Entry[]): IInvokeScriptCallStringArgument[] {
    return entries.map((entry) => {
      const type = typeof entry.value === 'number' ? 'int' : 'string'
      const insert = `set#${type}#${entry.key}#${entry.value}`
      const remove = `delete#${entry.key}`
      const isUndefined = entry.value === undefined
      return { type: 'string', value: isUndefined ? remove : insert }
    })
  }

  async broadcast(payload: Transactions.TTx) {
    try {
      const tx = await Transactions.broadcast(payload, nodeUrl)
      await Transactions.waitForTx(tx.id, { apiBase: nodeUrl })
      this.logger.debug(`Tx ${tx.id} sent, type ${tx.type}`)
      return tx.id
    } catch (err) {
      throw new BadRequestException({
        message: 'transaction failed',
        details: err
      })
    }
  }
}
