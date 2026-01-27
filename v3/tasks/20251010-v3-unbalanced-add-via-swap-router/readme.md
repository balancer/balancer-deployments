# 2025-10-10 - V3 Unbalanced Add Via Swap Router

This router is designed to allow adding liquidity unbalanced to pools that do not support it natively (e.g., ReCLAMMs). It uses Permit2, and does a proportional add followed by a calculated swap to achieve the desired token balances. This version can only be used with two-token pools.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/aed46f9b2c03bb08cd1ad3d37716ae86f2a4c44d).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [X-Layer mainnet addresses](./output/xlayer.json)
- [Monad mainnet addresses](./output/monad.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`UnbalancedAddViaSwapRouter` artifact](./artifact/UnbalancedAddViaSwapRouter.json)
