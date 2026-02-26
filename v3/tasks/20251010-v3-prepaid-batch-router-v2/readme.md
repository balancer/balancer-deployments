# 2025-10-10 - V3 Prepaid Batch Router V2

Contains the second deployment of the prepaid `BatchRouter` (formerly `AggregatorBatchRouter`), for complex multi-hop swaps (supports buffer wrap / unwrap). This version of the BatchRouter does not use permit2. The sender pays the required amounts to the Vault up front, avoiding any kind of token approval requirements.

It represents a refactor of the Router architecture to eliminate specific contracts for the permit2 vs. prepaid versions, instead determining behavior by the presence or absence of the permit2 reference on deployment. We also removed restrictions on add/remove liquidity and native ETH operations, and removed special-casing for BPT in the prepaid Batch Router (everything goes to the Vault).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/564d126abb8ef299e3ad5850398f128d186a3c4d).
- [`BatchRouter` artifact](./artifact/BatchRouter.json)
