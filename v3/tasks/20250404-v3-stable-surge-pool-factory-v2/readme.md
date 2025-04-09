# 2025-04-04 - V3 Stable Surge Pool Factory (V2)

Second deployment of the `StableSurgePoolFactory` for Balancer V3.
Pools from this factory use stable math, inspired by Curve stable pools, which is best suited for correlated assets.
They are also connected to the `StableSurgeHook`, which increases the swap fee in case of a depeg event according to internal thresholds.

This version uses [`StablePoolFactory` V2](../20250324-v3-stable-pool-v2/) to create the pools, which has a higher maximum amplification factor than V1, and allows the swap fee manager to modify it without governance intervention.

It also splits the deployment of the hook out of the factory deployment, allowing the hook to be reused by other factories if needed.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/193030ced01679b729e908e9d043cb20e3d51071).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`StablePool` artifact](./artifact/StablePool.json)
- [`StableSurgePoolFactory` artifact](./artifact/StableSurgePoolFactory.json)
