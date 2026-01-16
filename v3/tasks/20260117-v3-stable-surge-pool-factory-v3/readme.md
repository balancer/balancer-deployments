# 2026-01-17 - V3 Stable Surge Pool Factory (V3)

Third deployment of the `StableSurgePoolFactory` for Balancer V3.
Pools from this factory use stable math, inspired by Curve stable pools, which is best suited for correlated assets.
They are also connected to the `StableSurgeHook`, which increases the swap fee in case of a depeg event according to internal thresholds.

This version uses [`StablePoolFactory` V3](../20260116-v3-stable-pool-v3) to create the pools, which have stability improvements, longer pause window and allows setting a pool creator on pool deployment.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/6c37baf5d9efdc21c167e30fd6928446d717ab6e).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [X-Layer mainnet addresses](./output/xlayer.json)
- [Monad mainnet addresses](./output/monad.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`StablePool` artifact](./artifact/StablePool.json)
- [`StableSurgePoolFactory` artifact](./artifact/StableSurgePoolFactory.json)
