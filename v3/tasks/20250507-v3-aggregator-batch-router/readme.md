# 2025-05-07 - V3 Aggregator Batch Router

Contains the `AggregatorBatchRouter`, for complex multi-hop swaps (supports buffer wrap / unwrap). This version of the BatchRouter does not use permit2. The sender pays the required amounts to the Vault up front, avoiding any kind of token approval requirements.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/36ff00582ed1e75bd3b58b5c4394f5285df9da84).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [X-Layer mainnet addresses](./output/xlayer.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`AggregatorBatchRouter` artifact](./artifact/AggregatorBatchRouter.json)

