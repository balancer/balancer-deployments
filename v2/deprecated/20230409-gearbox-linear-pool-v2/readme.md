# 2023-04-09 - Gearbox Linear Pool V2

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> Linear pools have been deprecated in Balancer V2 together with boosted pools. Refer to [this article](https://medium.com/balancer-protocol/rate-manipulation-in-balancer-boosted-pools-technical-postmortem-53db4b642492) for reference.

Second deployment of the `GearboxLinearPoolFactory`, for Linear Pools with a Gearbox yield-bearing token (dieselToken).
Supersedes `20230213-gearbox-linear-pool`, modifying the pool factory to use Create2 when deploying a new pool.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Polygon zkeVM mainnet addresses](./output/zkevm.json)
- [Base mainnet addresses](./output/base.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`GearboxLinearPoolFactory` artifact](./artifact/GearboxLinearPoolFactory.json)
- [`GearboxLinearPool` artifact](./artifact/GearboxLinearPool.json)
- [`GearboxLinearPoolRebalancer` artifact](./artifact/GearboxLinearPoolRebalancer.json)
