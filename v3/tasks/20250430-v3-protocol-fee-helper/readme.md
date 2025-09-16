# 2025-04-30 - V3 Protocol Fee Helper

The Protocol Fee Helper contract enables granular control over the power to set protocol swap and yield fees on pools. It maintains a set of registered pools whose fees can be set by authorized accounts. Governance must first grant this contract permission to set protocol fees, then add a set of pools, and finally grant permission to call the fee setters on the helper contract.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/ab48d59c4a922327a127a2959470a8161409559d)
- [Plasma mainnet addresses](./output/plasma.json)
- [`ProtocolFeeHelper` artifact](./artifact/ProtocolFeeHelper.json)
