# 2025-05-30 - V3 ERC4626 Cow Swap Fee Burner

Contains `ERC4626CowSwapFeeBurner` for burning protocol fees collected as ERC4626 tokens, via the CoW Protocol.

The contract first unwraps the tokens and creates burn orders for the underlying assets, which are asynchronously executed through CoW Protocol.
If the underlying asset is the target token, the redeemed assets are forwarded directly to the recipient, without creating a new order.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/).
