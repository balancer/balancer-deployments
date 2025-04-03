# 2025-03-07 - V3 Router V2

Redeployment of the Base Router for V3.
Contains `Router` for basic, single step operations (e.g., pool initialization, add, remove, swap).

The original router can still be used. The difference is this version saves the sender (i.e., uses the `saveSender` modifier) on initialization as well as on add liquidity operations, enabling pools to verify the sender on liquidity operations (e.g., to enforce a single-LP, as in liquidity bootstrapping or treasury management pools).

There were also other changes to the Router contract and inheritance hierarchy since the original deployment (e.g., introduction of WethLib and `SenderGuard` in `RouterCommon`), but these are refactors designed to make router development easier (e.g., for the AggregatorRouter), and are not semantic or interface changes.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/577b86c7aec06c01e5f57bf20d4a0f728ce249b2).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`Router` artifact](./artifact/Router.json)

