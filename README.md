# SmartKey REST Api

## Installation

```bash
cp .env.example .env

# edit env variables

npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# e2e tests
npm run test:e2e

#unit tests
npm test
```

## Environment variables

- **PORT** - Port to run the app  
  **Example value** - `3000`

- **LOG_LEVEL** - Set log level. Available modes are ( none, standard, debug ). Logs are also saved in logs.txt file.
  **Example value** - `standard`

- **ADMIN_EMAIL** - Admin email  
  **Example value** - `admin@admin.com`

- **ADMIN_PASSWORD** - Admin password  
  **Example value** - `password`

- **JWT_SECRET** - String to use for creating JWT tokens  
  **Example value** - `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

- **JWT_VALID_TIME** - Time for which JWT token is valid  
  **Example value** - `1h`

- **BLOCKCHAIN_SEED** - Blockchain dApp backup phrase  
  **Example value** - `auto deposit have lake easy minute donkey solution okay account utility lady unusual actual idle`

- **BLOCKCHAIN_NODE_URL** - Blockchain public node url  
  **Example value** - `https://nodes-testnet.blockchainnodes.com`

- **BLOCKCHAIN_CHAIN_ID** - Blockchain chain id. For example testnet is 'T'  
  **Example value** - `T`

- **SUPPLIER_URL** - IoT platform API url  
  **Example value** - `https://liveobjects.Supplier-business.com/api/v1`

- **SUPPLIER_API_KEY** - IoT platform API key  
  **Example value** - `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

- **FAUCET_DEVICE** - Amount of tokens to transfer when creating new device  
  **Example value** - `10000000`

- **FAUCET_USER** - Amount of tokens to transfer when creating new user  
  **Example value** - `10000000`

- **KEY_MIN_DURATION** - Minimal time in milliseconds when key is valid  
  **Example value** - `3600000`

- **ENCRYPTION_SALT** - Salt phrase used to encrypt account seeds while creating blockchain accounts.
  **Example value** - `foobar`

- **ENCRYPTION_IV** - Initial vector used to encrypt account seeds while creating blockchain accounts.
  **Example value** - `0d8fa75738410842`

- **DEVICE_SCHEMA_VERSION** - Version of device address schema(it's saved on the blockchain)
  **Example value** `1.0`

## Seed phrase encryption

When this API creates a new blockchain account, it's seeds are encrypted with AES using `crypto-js`:

https://www.npmjs.com/package/crypto-js

Example usage:

```javascript
const CryptoJS = require('crypto-js')

function decrypt(message) {
  const salt = 'foobar'
  const iv = '0d8fa75738410842'

  return CryptoJS.AES.decrypt(message, salt, { iv }).toString(CryptoJS.enc.Utf8)
}
```

## Encryption details

Test over here:
https://www.devglan.com/online-tools/aes-encryption-decryption

- mode: CBC
- keySize: 256
- IV: set in ENV variable **ENCRYPTION_IV**
- SecretKey: **ENCRYPTION_SALT** => SHA256 => first 32 letters
- outputFormat: Base64
