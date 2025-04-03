# 2025-01-21 - V3 Stable Surge Pool Factory

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> The stable pool was superseded by this [updated version](../../tasks/20250404-v3-stable-surge-factory-v2/).

Deployment of the `StableSurgePoolFactory` for Balancer V3.
Pools from this factory use stable math, inspired by Curve stable pools, which is best suited for correlated assets.
They are also connected to the `StableSurgeHook`, which increases the swap fee in case of a depeg event according to internal thresholds.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/767a6a137be78bf7b6bb67b8ff423f53ef60939c).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`StablePool` artifact](./artifact/StablePool.json)
- [`StableSurgeHook` artifact](./artifact/StableSurgeHook.json)
- [`StableSurgePoolFactory` artifact](./artifact/StableSurgePoolFactory.json)
