# 2025-01-17 - V3 Balancer Contract Registry

`BalancerContractRegistry` maintains a registry of official Balancer Factories, Routers, Hooks, and valid ERC4626 tokens, for two main purposes. The first is to support the many instances where we need to know that a contract is "trusted" (i.e., is safe and behaves in the required manner). The second use case is for off-chain queries, or other protocols that need to easily determine, say, the "latest" Weighted Pool Factory.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/00c76a926fde4ff2eb7d9d76fd3af3d4d9df1e21).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`BalancerContractRegistry` artifact](./artifact/BalancerContractRegistry.json)
