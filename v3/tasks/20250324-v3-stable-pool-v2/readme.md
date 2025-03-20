# 2025-03-24 - V3 Stable pool (V2)

Second deployment of the `StablePoolFactory` for Balancer V3.
Pools from this factory use stable math, inspired by Curve stable pools, which is best suited for correlated assets.

This version increases the maximum amplification parameter from 5,000 to 50,000. It also grants the swap fee manager exclusive permission to modify the amplification parameter without governance action.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/e1ae7f091244ae20e5c1add3e7f89b6d33f48d23).
- [`StablePoolFactory` artifact](./artifact/StablePoolFactory.json)
