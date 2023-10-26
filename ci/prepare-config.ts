import path from 'path';
import { homedir } from 'os';
import { mkdirSync, writeFileSync } from 'fs';

const HH_CONFIG_FILENAME = `${homedir()}/.hardhat/networks.json`;

if (process.env.CI) {
  const content = `{
    "networks": {
      "mainnet": {
        "url": "${process.env.MAINNET_RPC_ENDPOINT}"
      },
      "polygon": {
        "url": "${process.env.POLYGON_RPC_ENDPOINT}"
      },
      "arbitrum": {
        "url": "${process.env.ARBITRUM_RPC_ENDPOINT}"
      },
      "optimism": {
        "url": "${process.env.OPTIMISM_RPC_ENDPOINT}"
      },
      "gnosis": {
        "url": "${process.env.GNOSIS_RPC_ENDPOINT}"
      },
      "bsc": {
        "url": "${process.env.BINANCE_RPC_ENDPOINT}"
      },
      "avalanche": {
        "url": "${process.env.AVALANCHE_RPC_ENDPOINT}"
      },
      "zkevm": {
        "url": "${process.env.ZKEVM_RPC_ENDPOINT}"
      },
      "goerli": {
        "url": "${process.env.GOERLI_RPC_ENDPOINT}"
      },
      "sepolia": {
        "url": "${process.env.SEPOLIA_RPC_ENDPOINT}"
      },
      "zkevm": {
        "url": "${process.env.ZKEVM_RPC_ENDPOINT}"
      },
      "base": {
        "url": "${process.env.BASE_RPC_ENDPOINT}"
      },
      "fantom": {
        "url": "${process.env.FANTOM_RPC_ENDPOINT}"
      }
    },
    "defaultConfig": {
      "gasPrice": "auto",
      "gasMultiplier": 1,
      "accounts": []
    }
  }`;

  mkdirSync(path.dirname(HH_CONFIG_FILENAME), { recursive: true });
  writeFileSync(HH_CONFIG_FILENAME, content);
}
