import { base58Encode, keccak, blake2b } from '@waves/ts-lib-crypto'

export const publicKeyToAddress = (publicKey: string, chainId: string): string => {
  // https://docs.waves.tech/en/blockchain/binary-format/address-binary-format

  const address: Uint8Array = new Uint8Array(22)
  address.set([1], 0)
  address.set([chainId.charCodeAt(0)], 1)
  address.set(keccak(blake2b(publicKey)).slice(0, 20), 2)

  const addressWithChecksum = new Uint8Array(26)
  addressWithChecksum.set(address, 0)
  addressWithChecksum.set(keccak(blake2b(address)).slice(0, 4), 22)

  return base58Encode(addressWithChecksum)
}
