# 2026-01-15 - V3 Weighted pool (Version 2)

Deployment of the `WeightedPoolFactory` for Balancer V3, version 2.
Pools from this factory use weighted math, which is best suited for uncorrelated assets (full price range).

This version contains stability improvements and a larger pause window.
Allows setting pool creator on pool deployment.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/6c37baf5d9efdc21c167e30fd6928446d717ab6e).
- [`WeightedPoolFactory` artifact](./artifact/WeightedPoolFactory.json)
- [`WeightedPool` artifact](./artifact/WeightedPool.json)
