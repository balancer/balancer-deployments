# 2025-01-23 - V3 Composite Liquidity Router (V2)

Composite Liquidity Router deployment for Balancer V3, version 2.
Contains `CompositeLiquidityRouter` for complex liquidity operations involving pools with ERC4626 wrappers.

This release has the following differences with respect to the [previous one](../../deprecated/20241205-v3-composite-liquidity-router/):
- Allows individually choosing which tokens to wrap / unwrap for boosted pool operations, as opposed to wrapping / unwrapping automatically.
- Excludes nested pool operations.

Composite Liquidity Router V1 is still safe to use, although its automatic wrap / unwrap mechanism is not well suited for pools with wrappers that are treated like regular tokens (e.g. `sDAI`).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/68cc540d16270044fc4ac6fbdcb24c2cf4fc87bf).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`CompositeLiquidityRouter` artifact](./artifact/CompositeLiquidityRouter.json)

