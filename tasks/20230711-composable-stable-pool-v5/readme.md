# 2023-07-11 - Composable Stable Pool V5

Deployment of `ComposableStablePoolFactory`, which supersedes `20230320-composable-stable-pool-v4`.
This version is resilient to abrupt changes in the value reported by the pool tokens' rate providers, and calculates
protocol fees appropriately even with volatile or rapidly changing token rates.
It also disables individual flags for yield-exempt tokens; now the pool is either yield exempt or non-exempt for every
token.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [BSC mainnet addresses](./output/bsc.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Polygon zkeVM mainnet addresses](./output/zkevm.json)
- [Goerli testnet addresses](./output/goerli.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ComposableStablePoolFactory` artifact](./artifact/ComposableStablePoolFactory.json)
