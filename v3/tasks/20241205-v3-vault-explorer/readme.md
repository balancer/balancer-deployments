# 2024-12-05 - Vault Explorer

Deployment of `VaultExplorer`, a "window" on the Vault that provides easy access to view functions across all Vault contracts for off-chain utilities like Etherscan. Since the Vault implements the Proxy pattern to fit within the EVM bytecode requirements, most functions are on extension contracts that cannot be called directly. The `VaultExplorer` is a wrapper contract that exposes all permissionless view functions (plus `collectAggregateFees`).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/25d73b3d091f5dde943ad6b7d90db9569222510d)
- [`VaultExplorer` artifact](./artifact/VaultExplorer.json)
