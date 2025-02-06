# 2025-01-21 - V3 Stable Surge Factory

Deployment of the `StableSurgeFactory` for Balancer V3.
Pools from this factory use stable math, inspired by Curve stable pools, which is best suited for correlated assets.
They are also connected to the `StableSurgeHook`, which increases the swap fee in case of a depeg event according to internal thresholds.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/1c9d6a2913eb2d1210019455b44192760d9beb03).
- [`StablePool` artifact](./artifact/StablePool.json)
- [`StableSurgeHook` artifact](./artifact/StableSurgeHook.json)
- [`StableSurgePoolFactory` artifact](./artifact/StableSurgePoolFactory.json)
