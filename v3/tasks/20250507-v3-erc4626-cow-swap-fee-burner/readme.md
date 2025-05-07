# 2025-06-07 - V3 ERC4626 Cow Swap Fee Burner

Contains `ERC4626CowSwapFeeBurner` for burning protocol fees in the form of ERC4626 tokens via CoW Protocol. 

The contract first unwraps the tokens and creates burn orders for the underlying assets, which are asynchronously executed through CoW Protocol.
If the underlying asset is the target token, the redeemed assets are forwarded directly to the recipient directly without creating a new order.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/f2c6974b4f3b503422ca99061df2af559970f135).
- [`ERC4626CowSwapFeeBurner` artifact](./artifact/ERC4626CowSwapFeeBurner.json)
