# 2025-05-30 - V3 ERC4626 Cow Swap Fee Burner V2

Contains `ERC4626CowSwapFeeBurner` for burning protocol fees collected as ERC4626 tokens, via the CoW Protocol. This version implements a few fixes involving subsequent orders for one token, as well as better access controls following the ownable pattern.

The contract first unwraps the tokens and creates burn orders for the underlying assets, which are asynchronously executed through CoW Protocol.
If the underlying asset is the target token, the redeemed assets are forwarded directly to the recipient, without creating a new order.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/84cfb0d9d0bd024f92c7a95c64ab7ab8b4c12f4b).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ERC4626CowSwapFeeBurner` artifact](./artifact/ERC4626CowSwapFeeBurner.json)