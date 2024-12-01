# 2023-07-31 - Stakeless Gauge Checkpointer

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version has been replaced for an updated version: [StakelessGaugeCheckpointer V2](../../20230915-stakeless-gauge-checkpointer-v2/). The new version is more flexible, supporting paid gauges from any type (i.e. not just only Arbitrum).

Deployment of the `StakelessGaugeCheckpointer` contract. It automates the process of performing checkpoints to stakeless root gauges.
Replaces the [`L2GaugeCheckpointer`](../20230527-l2-gauge-checkpointer/); its former name was changed to avoid confusion between root and child chain gauges, as the checkpointer is intended to work only with root gauges in mainnet.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`StakelessGaugeCheckpointer` artifact](./artifact/StakelessGaugeCheckpointer.json)
