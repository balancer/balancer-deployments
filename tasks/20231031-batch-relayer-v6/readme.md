# 2023-10-31 - Batch Relayer V6

Deployment of the sixth `BalancerRelayer` using `BatchRelayerLibrary`, for combining multiple operations (swaps, joins, etc.) in a single transaction.

This version supports Recovery Mode exits, and adds a new `vaultActionsQueryMulticall`. This takes the same data as the standard `multicall`, but does query swaps, joins, and exits instead of the standard state-changing operations. Consequently, this can be called without any approvals.

## Useful Files

- [`BalancerRelayer` artifact](./artifact/BalancerRelayer.json)