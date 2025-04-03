# 2024-12-05 - V3 Vault Explorer

Deployment of `VaultExplorer`, a "window" on the V3 Vault that provides easy access to view functions across all Vault contracts for off-chain utilities like Etherscan. Since the Vault implements the Proxy pattern to fit within the EVM bytecode requirements, most functions are on extension contracts that cannot be called directly. The `VaultExplorer` is a wrapper contract that exposes all permissionless view functions (plus `collectAggregateFees`).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/25d73b3d091f5dde943ad6b7d90db9569222510d)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`VaultExplorer` artifact](./artifact/VaultExplorer.json)
