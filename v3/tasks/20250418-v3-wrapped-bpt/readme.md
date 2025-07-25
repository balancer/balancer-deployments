# 2025-04-18 - V3 Wrapped BPT Factory

Deployment of `WrappedBalancerPoolTokenFactory`, a method of creating "staked" BPT that can only be minted or burned when the Vault is locked, ensuring it is "real" and not transient BPT, which would be subject to manipulation. These wrapped versions of BPT are then much safer to use in applications like collateral on lending platforms.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/0d2de793ea4da7b0750f56ea01c8ea9788801f64)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`WrappedBalancerPoolTokenFactory` artifact](./artifact/WrappedBalancerPoolTokenFactory.json)
- [`WrappedBalancerPoolToken` artifact](./artifact/WrappedBalancerPoolToken.json)
