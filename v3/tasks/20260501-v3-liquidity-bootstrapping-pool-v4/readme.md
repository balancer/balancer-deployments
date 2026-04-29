# 2026-05-01 - V3 Liquidity Bootstrapping Pool (V4)

Fourth deployment for the LBPool, a Weighted Pool with mutable weights, designed to support v3 Liquidity Bootstrapping.

This deployment simplifies the LBP by removing the (so far unused) liquidity migration feature. The previous version can still be used if migration is required.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/0a5890a8c5d79865498d75cdc6ecdc75cf8d297d)
- [`LBPoolFactory` artifact](./artifact/LBPoolFactory.json)
- [`LBPool` artifact](./artifact/LBPool.json)
