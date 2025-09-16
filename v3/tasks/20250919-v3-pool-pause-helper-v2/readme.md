# 2025-09-19 - V3 Pool Pause Helper V2

This second deployment of the Pool Pause Helper contract enables granular control over the power to pause pools. It maintains multiple sets of registered pools that can be paused by authorized accounts. In contrast to the first version, governance only needs to grant this contract permission to pause pools. The pause helper is deployed with an admin account (e.g., the Maxi's multisig), which has the sole power to manage allowlists for partners and assign them initial managers. Thereafter, managers can pause the pools on their respective allowlists, and transfer that authority to successor managers: all without involving Balancer governance.

Note that as in V1, unpausing is not addressed here, and still must be explicitly granted by governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/4ac0a9a089c0458a01989518322700ef275c9cba)
- [`PoolPauseHelper` artifact](./artifact/PoolPauseHelper.json)
