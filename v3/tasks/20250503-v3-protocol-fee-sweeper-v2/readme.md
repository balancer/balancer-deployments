# 2025-05-03 - V3 Protocol Fee Sweeper V2

The Protocol Fee Sweeper is a helper contract to convert protocol fees collected in a wide variety of tokens to a common "target" token for the treasury (e.g., USDC).

It does this for each pool by withdrawing tokens from the Protocol Fee Controller to itself, and calling a configurable "burner" contract (e.g., from CowSwap) that does the actual conversion swaps, and forwards the proceeds to a recipient (e.g., the treasury).

This version can unwrap tokens on demand before calling the burner.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/fa386c4c675bac0512ade9e565f4e437bc06dcb9)
- [`ProtocolFeeSweeper` artifact](./artifact/ProtocolFeeSweeper.json)
