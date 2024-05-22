# 2023-10-31 - Batch Relayer V6

Deployment of the sixth `BalancerRelayer` using `BatchRelayerLibrary`, for combining multiple operations (swaps, joins, etc.) in a single transaction.

This version supports Recovery Mode exits, and adds a new `vaultActionsQueryMulticall`. This takes the same data as the standard `multicall`, but does query swaps, joins, and exits instead of the standard state-changing operations. Consequently, this can be called without any approvals.

This version also adds gauge checkpoint / mint capabilities for gauges (both mainnet liquidity gauges and L2 child chain gauges).

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
- [Fraxtal mainnet addresses](./output/fraxtal.json)
- [Mode mainnet addresses](./output/mode.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`BalancerRelayer` artifact](./artifact/BalancerRelayer.json)
