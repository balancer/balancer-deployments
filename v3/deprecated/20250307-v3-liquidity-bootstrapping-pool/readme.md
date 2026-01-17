# 2025-03-07 - V3 Liquidity Bootstrapping Pool

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version was superseded by [`LiquidityBoostrappingPool` V2](../20250701-v3-liquidity-bootstrapping-pool-v2/), which (optionally) allows enforcing liquidity migration when the LBP is created. This deployment can still be used if the migration functionality is not desired.

Deployment for the LBPool, a Weighted Pool with mutable weights, designed to support v3 Liquidity Bootstrapping. This V3 version is more restrictive than LBPs were in V2, in order to make them more deterministic, simpler for aggregators, and safer for end users. They are limited to two tokens and a single weight change operation, specified on deployment.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/577b86c7aec06c01e5f57bf20d4a0f728ce249b2)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`LBPoolFactory` artifact](./artifact/LBPoolFactory.json)
- [`LBPool` artifact](./artifact/LBPool.json)
