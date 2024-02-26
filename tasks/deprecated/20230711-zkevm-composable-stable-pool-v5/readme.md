# 2023-07-11 - Composable Stable Pool V5 (Polygon ZKEVM)

> ⚠️ **DEPRECATED** ⚠️
>
> This version has been replaced just for Polygon ZKEVM chain after the Dragon Fruit hard fork.
> The new deployment can be found [here](../20230711-composable-stable-pool-v5/), and the build info is exactly the same. The deprecated task is kept to preserve a record of the old deployment addresses and action IDs.

Deployment of `ComposableStablePoolFactory`, which supersedes `20230320-composable-stable-pool-v4`.
This version is resilient to abrupt changes in the value reported by the pool tokens' rate providers, and calculates
protocol fees appropriately even with volatile or rapidly changing token rates.
It also disables individual flags for yield-exempt tokens; now the pool is either yield exempt or non-exempt for every
token.

## Useful Files

- [Polygon zkeVM mainnet addresses](./output/zkevm.json)
- [`ComposableStablePoolFactory` artifact](./artifact/ComposableStablePoolFactory.json)
