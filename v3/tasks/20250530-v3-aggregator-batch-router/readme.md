# 2025-05-30 - V3 Aggregator Batch Router

Contains the `AggregatorBatchRouter`, for complex multi-hop swaps (supports single token add / remove types and buffer wrap / unwrap). This version of the BatchRouter does not use permit2. The sender pays the required amounts to the Vault up front, avoiding any kind of token approval requirements.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/006c64373186aedabaf7e85431499e336e2c4a2e).
- [`AggregatorBatchRouter` artifact](./artifact/AggregatorBatchRouter.json)

