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

-  **ADMIN_EMAIL** - Admin email  
**Example value** - `admin@admin.com`

-  **ADMIN_PASSWORD** - Admin password  
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

- **SUPPLIER_URL** - Supplier API url  
**Example value** - `https://liveobjects.Supplier-business.com/api/v1`

- **SUPPLIER_API_KEY** - Supplier API key  
**Example value** - `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

- **FAUCET_DEVICE** - Amount of tokens to transfer when creating new device  
**Example value** - `10000000`

- **FAUCET_USER** - Amount of tokens to transfer when creating new user  
**Example value** - `10000000`

- **KEY_MIN_DURATION** - Minimal time in milliseconds when key is valid  
**Example value** - `3600000`

- **KEY_MAX_AMOUNT** - Maximal amount of keys to generate in single request
**Example value** - `50`
