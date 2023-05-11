# 2023-02-13 - Yearn Linear Pool

> ⚠️ **DEPRECATED: do not use** ⚠️
> This deployment has been deprecated in favor of a new version that uses create2 for pool deployments: [yearn-linear-pool-v2](../../20230409-yearn-linear-pool-v2/).

First deployment of the `YearnLinearPoolFactory`, for Linear Pools with a Yearn yield-bearing token.
Already fixes the reentrancy issue described in https://forum.balancer.fi/t/reentrancy-vulnerability-scope-expanded/4345.
Also has a fix in the `YearnLinearPoolRebalancer` to handle tokens which require the `SafeERC20` library for approvals.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Goerli testnet addresses](./output/goerli.json)
- [`YearnLinearPoolFactory` artifact](./artifact/YearnLinearPoolFactory.json)
- [`YearnLinearPool` artifact](./artifact/YearnLinearPool.json)
- [`YearnLinearPoolRebalancer` artifact](./artifact/YearnLinearPoolRebalancer.json)
- [`YearnShareValueHelper` artifact](./artifact/YearnShareValueHelper.json)
