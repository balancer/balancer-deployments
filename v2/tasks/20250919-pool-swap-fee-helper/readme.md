# 2025-09-19 - Pool Swap Fee Helper

The Pool Swap Fee Helper contract enables granular control over the power to set swap fees on pools. It maintains multiple sets of registered pools whose swap fees can be set by authorized accounts. Governance only needs to grant this contract permission to set swap fees on the pools (once per pool factory).

The swap fee helper is deployed with an admin account (e.g., the Maxi's multisig), which has the sole power to manage allowlists for partners and assign them initial managers. Thereafter, managers can set the swap fees for pools in their respective allowlists, and transfer that authority to successor managers: all without involving Balancer governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v2-monorepo/commit/46a0969457abe6d0348f6be7df6b315695269754)
- [`PoolSwapFeeHelper` artifact](./artifact/PoolSwapFeeHelper.json)
