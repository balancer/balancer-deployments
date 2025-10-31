# 2025-10-10 - V3 Composite Liquidity Router (V3)

Composite Liquidity Router deployment for Balancer V3, version 3.
This version of the `CompositeLiquidityRouter` restores nested pool functionality, and incorporates an extensive refactoring of the router inheritance structure, namely unifying regular (permit2) and prepaid ("aggregator") versions, designed to be called by contracts, where the deployer indicates this is a "prepaid" router by passing in the zero address for Permit2. (This deployment uses Permit2.)

Composite Liquidity Routers V1 and V2 are still safe to use.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/46e053b17c0761a07b5fff899e8c7a7fb1a74874).
- [`CompositeLiquidityRouter` artifact](./artifact/CompositeLiquidityRouter.json)
