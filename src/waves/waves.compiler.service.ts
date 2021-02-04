import { Injectable } from '@nestjs/common'
import * as Crypto from '@waves/ts-lib-crypto'
import config from '../config'
import * as fs from 'fs'
import { exec } from 'child_process'

const { seed, chainId } = config().waves

@Injectable()
export class WavesCompilerService {
  private getFromCache(): string | null {
    const dappAddress = Crypto.address(seed, chainId)
    const path = `./assets/${dappAddress}.cache`
    const exists = fs.existsSync(path)
    if (!exists) return null

    return fs.readFileSync(path).toString()
  }

  async getScript() {
    const fromCache = this.getFromCache()

    if (fromCache) return fromCache

    return await this.compileDeviceScript()
  }

  fetchScript(name: 'device' | 'dapp'): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(`./assets/${name}.base64`, {}, (err, data) => {
        if (err) reject(err)

        resolve(data.toString())
      })
    })
  }

  private async compileDeviceScript() {
    console.warn('Compiling script ...')

    const dappAddress = Crypto.address(seed, chainId)
    const surfboardPath = 'node_modules/@waves/surfboard/bin/run'
    const templatePath = './assets/device.template.ride'
    const codePath = './assets/device.script.cache'
    const command = `node ${surfboardPath} compile ${codePath}`
    const cachePath = `./assets/${dappAddress}.cache`

    const template = fs.readFileSync(templatePath).toString()
    const code = template.replace('FFFFFF', dappAddress)
    fs.writeFileSync(codePath, code)

    const compile = () => {
      return new Promise<string>((resolve, reject) => {
        exec(command, (err, stdout) => {
          if (err) reject(err)

          // remove end line character
          resolve(stdout.substring(0, stdout.length - 1))
        })
      })
    }

    const base64 = await compile()
    fs.writeFileSync(cachePath, base64)

    return base64
  }
}
