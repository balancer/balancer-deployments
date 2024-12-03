# 2023-04-09 - Yearn Linear Pool V2

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> Linear pools have been deprecated in Balancer V2 together with boosted pools. Refer to [this article](https://medium.com/balancer-protocol/rate-manipulation-in-balancer-boosted-pools-technical-postmortem-53db4b642492) for reference.

Second deployment of the `YearnLinearPoolFactory`, for Linear Pools with a Yearn yield-bearing token.
Supersedes `20230213-yearn-linear-pool`, modifying the pool factory to use Create2 when deploying a new pool.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Polygon zkeVM mainnet addresses](./output/zkevm.json)
- [Base mainnet addresses](./output/base.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`YearnLinearPoolFactory` artifact](./artifact/YearnLinearPoolFactory.json)
- [`YearnLinearPool` artifact](./artifact/YearnLinearPool.json)
- [`YearnLinearPoolRebalancer` artifact](./artifact/YearnLinearPoolRebalancer.json)
- [`YearnShareValueHelper` artifact](./artifact/YearnShareValueHelper.json)
