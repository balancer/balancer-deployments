# 2025-04-30 - V3 Pool Swap Fee Helper

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version was superseded by [`PoolSwapFeeHelper` V2](../../tasks/20250919-v3-pool-swap-fee-helper-v2/), which generalizes the implementation to allow multiple, transferrable allowlists. This allows multiple partners to use the same contract, and eases the burden on governance.

The Pool Swap Fee Helper contract enables granular control over the power to set static swap fees on pools. It maintains a set of registered pools whose fees can be set by authorized accounts. Governance must first grant this contract permission to set swap fees, then add a set of pools, and finally grant permission to call the fee setter on the helper contract.

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
- [`PoolSwapFeeHelper` artifact](./artifact/PoolSwapFeeHelper.json)
