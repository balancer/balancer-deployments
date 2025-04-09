# 2025-04-07 - V3 Vault Explorer (V2)

Second deployment of `VaultExplorer`, a "window" on the V3 Vault that provides easy access to view functions across all Vault contracts for off-chain utilities like Etherscan.

This version adds missing getters for buffer assets, and also `enableRecoveryMode`, which becomes permissionless if the pool or Vault are paused. This makes it easier for non-technical users to withdraw funds if, for instance, governance or an automatic maintenance process paused the pool but did not enable recovery mode.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/193030ced01679b729e908e9d043cb20e3d51071)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`VaultExplorer` artifact](./artifact/VaultExplorer.json)
