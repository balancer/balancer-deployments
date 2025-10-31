# 2025-10-10 - V3 Prepaid Composite Liquidity Router (V3)

Prepaid Composite Liquidity Router deployment for Balancer V3.
Contains a prepaid version of the `CompositeLiquidityRouter` for complex liquidity operations involving pools with ERC4626 wrappers, as well as nested pools.

The contract is identical to the regular Composite Liquidity Router (V3), with the prepaid flag turned on by passing the zero address to Permit2 on deployment.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/46e053b17c0761a07b5fff899e8c7a7fb1a74874).
- [`CompositeLiquidityRouter` artifact](./artifact/CompositeLiquidityRouter.json)
