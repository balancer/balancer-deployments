# 2024-12-16 - Batch Relayer V6 - Reliquary

Deployment of the sixth `BalancerRelayer` using `BatchRelayerLibrary`, for combining multiple operations (swaps, joins, etc.) in a single transaction.

This version supports Recovery Mode exits, and adds a new `vaultActionsQueryMulticall`. This takes the same data as the standard `multicall`, but does query swaps, joins, and exits instead of the standard state-changing operations. Consequently, this can be called without any approvals.

This version also adds gauge checkpoint / mint capabilities for gauges (both mainnet liquidity gauges and L2 child chain gauges).

Added support for reliquary

## Useful Files

- [Sonic mainnet addresses](./output/sonic.json)
- [`BalancerRelayer` artifact](./artifact/BalancerRelayer.json)
