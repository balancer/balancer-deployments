# 2023-04-10 - Silo Linear Pool V2

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> Linear pools have been deprecated in Balancer V2 together with boosted pools. Refer to [this article](https://medium.com/balancer-protocol/rate-manipulation-in-balancer-boosted-pools-technical-postmortem-53db4b642492) for reference.

Second deployment of the `SiloLinearPoolFactory`, for Linear Pools with a Silo yield-bearing token (shareToken).
Supersedes `20230315-silo-linear-pool`, modifying the pool factory to use Create2 when deploying a new pool.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`SiloExchangeRateModel` artifact](./artifact/SiloExchangeRateModel.json)
- [`SiloLinearPool` artifact](./artifact/SiloLinearPool.json)
- [`SiloLinearPoolFactory` artifact](./artifact/SiloLinearPoolFactory.json)
- [`SiloLinearPoolRebalancer` artifact](./artifact/SiloLinearPoolRebalancer.json)
