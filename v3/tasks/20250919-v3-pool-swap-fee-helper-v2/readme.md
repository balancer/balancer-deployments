# 2025-09-19 - V3 Pool Swap Fee Helper V2

This second deployment of the Pool Swap Fee Helper contract enables granular control over the power to set swap fees on pools. It maintains multiple sets of registered pools whose swap fees can be set by authorized accounts. In contrast to the first version, governance only needs to grant this contract permission to set swap fees on pools.

The swap fee helper is deployed with an admin account (e.g., the Maxi's multisig), which has the sole power to manage allowlists for partners and assign them initial managers. Thereafter, managers can set the swap fees for pools in their respective allowlists, and transfer that authority to successor managers: all without involving Balancer governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/2a73ff06cfe55482bdebc37ee74ca3b93d9ea062)
- [`PoolSwapFeeHelper` artifact](./artifact/PoolSwapFeeHelper.json)
