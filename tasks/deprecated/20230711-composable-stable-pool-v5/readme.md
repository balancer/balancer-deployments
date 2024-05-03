# 2023-07-11 - Composable Stable Pool V5

> ⚠️ **DEPRECATED** ⚠️
>
> This version has been replaced for an updated version: [Composable Stable Pool V6](../../20240223-composable-stable-pool-v6). The new version has the same functionality, but larger pause and buffer windows; this version can still be used if pausing is deemed unnecessary for specific pools.

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
- [Base mainnet addresses](./output/base.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ComposableStablePoolFactory` artifact](./artifact/ComposableStablePoolFactory.json)
