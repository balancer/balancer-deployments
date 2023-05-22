# 2023-01-09 - GaugeAdder V3

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> Superseded by [Gauge Adder V4](../../20230519-gauge-adder-v4), introduces dynamic gauge types and canonical gauge factories for each type.

Deployment of the new `GaugeAdder`, a helper contract which helps prevent some forms of improper configuration on the `GaugeController`. This version adds support for the Authorizer Adapter Entrypoint, and removes the restriction that only allowed a single gauge per pool.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [Goerli addresses](./output/goerli.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`GaugeAdder` artifact](./artifact/GaugeAdder.json)
- [`LiquidityGaugeFactory` artifact](./artifact/LiquidityGaugeFactory.json)
- [`LiquidityGaugeV5` artifact](./artifact/LiquidityGaugeV5.json)
- [Previous `GaugeAdder` deployment](../20220628-gauge-adder-v2/)
