# 2025-09-19 - Pool Swap Fee Helper

The Pool Swap Fee Helper contract enables granular control over the power to set swap fees on pools. It maintains multiple sets of registered pools whose swap fees can be set by authorized accounts. Governance only needs to grant this contract permission to set swap fees on the pools (once per pool factory).

The swap fee helper is deployed with an admin account (e.g., the Maxi's multisig), which has the sole power to manage allowlists for partners and assign them initial managers. Thereafter, managers can set the swap fees for pools in their respective allowlists, and transfer that authority to successor managers: all without involving Balancer governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v2-monorepo/commit/46a0969457abe6d0348f6be7df6b315695269754)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [BSC mainnet addresses](./output/bsc.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Polygon zkeVM mainnet addresses](./output/zkevm.json)
- [Base mainnet addresses](./output/base.json)
- [Fraxtal mainnet addresses](./output/fraxtal.json)
- [Mode mainnet addresses](./output/mode.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`PoolSwapFeeHelper` artifact](./artifact/PoolSwapFeeHelper.json)
