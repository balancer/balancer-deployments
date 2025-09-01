# 2025-02-28 - V3 Protocol Fee Sweeper

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version was superseded by [`ProtocolFeeSweeper` V2](../../tasks/20250503-v3-protocol-fee-sweeper-v2/), which allows unwrapping tokens before burning them.

The Protocol Fee Sweeper is a helper contract to convert protocol fees collected in a wide variety of tokens to a common "target" token for the treasury (e.g., USDC).

It does this for each pool by withdrawing tokens from the Protocol Fee Controller to itself, and calling a configurable "burner" contract (e.g., from CowSwap) that does the actual conversion swaps, and forwards the proceeds to a recipient (e.g., the treasury).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/79dcd5e045c0e3c30951d338cbac7d41f61f05e8)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ProtocolFeeSweeper` artifact](./artifact/ProtocolFeeSweeper.json)
