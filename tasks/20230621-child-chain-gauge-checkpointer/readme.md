# 2023-06-21 - Child Chain Gauge Checkpointer (Batch Relayer V5.1) 

L2 deployment of the `BalancerRelayer` and `BatchRelayerLibrary` based on [Relayer V5](../20230314-batch-relayer-v5/), with added gauge checkpoint functionality.

This deployment will not be used as a trusted relayer by the Vault; it will only be used as a `ChildChainGauge` checkpointer, allowing to perform multiple (permissionless) gauge checkpoints in the same transaction. Therefore, it does **not** replace Relayer V5.

## Useful Files

- [`BatchRelayerLibrary` artifact](./artifact/BatchRelayerLibrary.json)
