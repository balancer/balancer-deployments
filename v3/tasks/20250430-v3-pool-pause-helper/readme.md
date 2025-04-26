# 2025-04-30 - V3 Pool Pause Helper

The Pool Pause Helper contract enables granular control over the power to pause pools. It maintains a set of registered pools that can be paused by authorized accounts. Governance must first grant this contract permission to pause pools, then add a set of pools, and finally grant permission to call pause on the helper contract.

Note that unpausing is not addressed here, and still must be explicitly granted by governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/ab48d59c4a922327a127a2959470a8161409559d)
- [`PoolPauseHelper` artifact](./artifact/PoolPauseHelper.json)
