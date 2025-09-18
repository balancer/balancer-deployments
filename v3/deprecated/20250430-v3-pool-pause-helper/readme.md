# 2025-04-30 - V3 Pool Pause Helper

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version was superseded by [`PoolPauseHelper` V2](../../tasks/20250919-v3-pool-pause-helper-v2/), which generalizes the implementation to allow multiple, transferrable allowlists. This allows multiple partners to use the same contract, and eases the burden on governance.

The Pool Pause Helper contract enables granular control over the power to pause pools. It maintains a set of registered pools that can be paused by authorized accounts. Governance must first grant this contract permission to pause pools, then add a set of pools, and finally grant permission to call pause on the helper contract.

Note that unpausing is not addressed here, and still must be explicitly granted by governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/ab48d59c4a922327a127a2959470a8161409559d)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`PoolPauseHelper` artifact](./artifact/PoolPauseHelper.json)
