# 2023-07-31 - Stakeless Gauge Checkpointer

Deployment of the `StakelessGaugeCheckpointer` contract. It automates the process of performing checkpoints to stakeless root gauges.
Replaces the [`L2GaugeCheckpointer`](../deprecated/20230527-l2-gauge-checkpointer/); its former name was changed to avoid confusion between root and child chain gauges, as the checkpointer is intended to work only with root gauges in mainnet.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`StakelessGaugeCheckpointer` artifact](./artifact/StakelessGaugeCheckpointer.json)
