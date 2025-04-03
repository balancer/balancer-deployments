# 2025-03-24 - V3 Stable pool (V2)

Second deployment of the `StablePoolFactory` for Balancer V3.
Pools from this factory use stable math, inspired by Curve stable pools, which is best suited for correlated assets.

This version increases the maximum amplification parameter from 5,000 to 50,000. It also grants the swap fee manager exclusive permission to modify the amplification parameter without governance action.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/e1ae7f091244ae20e5c1add3e7f89b6d33f48d23).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`StablePoolFactory` artifact](./artifact/StablePoolFactory.json)
