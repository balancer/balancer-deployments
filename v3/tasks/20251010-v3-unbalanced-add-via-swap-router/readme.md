# 2025-10-10 - V3 Unbalanced Add Via Swap Router

This router is designed to allow adding liquidity unbalanced to pools that do not support it natively (e.g., ReCLAMMs). It uses Permit2, and does a proportional add followed by a calculated swap to achieve the desired token balances. This version can only be used with two-token pools.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/aed46f9b2c03bb08cd1ad3d37716ae86f2a4c44d).
- [`UnbalancedAddViaSwapRouter` artifact](./artifact/UnbalancedAddViaSwapRouter.json)
