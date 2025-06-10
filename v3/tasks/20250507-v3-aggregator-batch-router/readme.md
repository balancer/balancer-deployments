# 2025-05-07 - V3 Aggregator Batch Router

Contains the `AggregatorBatchRouter`, for complex multi-hop swaps (supports buffer wrap / unwrap). This version of the BatchRouter does not use permit2. The sender pays the required amounts to the Vault up front, avoiding any kind of token approval requirements.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/36ff00582ed1e75bd3b58b5c4394f5285df9da84).
- [`AggregatorBatchRouter` artifact](./artifact/AggregatorBatchRouter.json)

