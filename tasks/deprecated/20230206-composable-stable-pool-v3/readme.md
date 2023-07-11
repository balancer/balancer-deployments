# 2023-02-06 - Composable Stable Pool V3

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This deployment was deprecated in favor of a new version which uses create2 for pool deployment: [composable-stable-pool-v4](../20230320-composable-stable-pool-v4/). The active version of the composable stable pool can be found [here](../../20230711-composable-stable-pool-v5/).

Deployment of `ComposableStablePoolFactory`, which allows creating Stable Pools that are suitable to be included in other Pools.
Supersedes `20221122-composable-stable-pool-v2`, fixing the reentrancy issue described in this [forum post](https://forum.balancer.fi/t/reentrancy-vulnerability-scope-expanded/4345).

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [BSC mainnet addresses](./output/bsc.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Goerli testnet addresses](./output/goerli.json)
- [`ComposableStablePool` artifact](./artifact/ComposableStablePool.json)
- [`ComposableStablePoolFactory` artifact](./artifact/ComposableStablePoolFactory.json)
