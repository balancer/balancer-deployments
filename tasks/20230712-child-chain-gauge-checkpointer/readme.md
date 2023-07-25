# 2023-07-12 - Child Chain Gauge Checkpointer (Batch Relayer V5.1) 

L2 deployment of the `BalancerRelayer` and `BatchRelayerLibrary` based on [Relayer V5](../20230314-batch-relayer-v5/), with added gauge checkpoint functionality.

This deployment will not be used as a trusted relayer by the Vault; it will only be used as a `ChildChainGauge` checkpointer, allowing to perform multiple (permissionless) gauge checkpoints in the same transaction. Therefore, it does **not** replace Relayer V5.

## Useful Files

- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [BSC mainnet addresses](./output/bsc.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Polygon zkeVM mainnet addresses](./output/zkevm.json)
- [Goerli testnet addresses](./output/goerli.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`BatchRelayerLibrary` artifact](./artifact/BatchRelayerLibrary.json)
