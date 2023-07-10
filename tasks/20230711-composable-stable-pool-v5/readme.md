# 2023-07-11 - Composable Stable Pool V5

Deployment of `ComposableStablePoolFactory`, which supersedes `20230320-composable-stable-pool-v4`.
This version is resilient to abrupt changes in the value reported by the pool tokens' rate providers, and calculates
protocol fees appropriately even with volatile or rapidly changing token rates.
It also disables individual flags for yield-exempt tokens; now the pool is either yield exempt or non-exempt for every
token.

## Useful Files

- [`ComposableStablePoolFactory` artifact](./artifact/ComposableStablePoolFactory.json)
