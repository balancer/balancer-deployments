# 2023-05-27 - L2 Gauge Checkpointer

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version has been replaced for an updated version: [StakelessGaugeCheckpointer](../20230731-stakeless-gauge-checkpointer/). The new version corrects the period used to perform the checkpoints to the start of the previous week, and adds the capability to checkpoint multiple gauges given their addresses in the same transaction.

Deployment of the `L2GaugeCheckpointer` contract. It automates the process of performing checkpoints to stakeless root gauges.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [`L2GaugeCheckpointer` artifact](./artifact/L2GaugeCheckpointer.json)
