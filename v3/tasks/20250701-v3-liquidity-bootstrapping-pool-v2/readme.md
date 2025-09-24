# 2025-07-01 - V3 Liquidity Bootstrapping Pool (V2)

Second deployment for the LBPool, a Weighted Pool with mutable weights, designed to support v3 Liquidity Bootstrapping. LBPs in Balancer V3 are more restrictive than what they were in V2, in order to make them more deterministic, simpler for aggregators, and safer for end users. They are limited to two tokens and a single weight change operation, specified on deployment.

This deployment includes the capability to enforce a liquidity migration to a weighted pool when the LBP is created, locking the liquidity for a predefined amount of time after the migration takes place.

Migration is optional, and is defined when the LBP is created.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/1889fb73671e08d647ad1744cfa9a9147fc902a2)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`LBPoolFactory` artifact](./artifact/LBPoolFactory.json)
- [`LBPool` artifact](./artifact/LBPool.json)
- [`LBPMigrationRouter` artifact](./artifact/LBPMigrationRouter.json)
- [`BPTTimeLocker` artifact](./artifact/BPTTimeLocker.json)
