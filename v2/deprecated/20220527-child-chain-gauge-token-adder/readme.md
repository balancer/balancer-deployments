# 2022-05-27 - Child Chain Gauge Token Adder

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> Child chain gauge factory V1 was deprecated in favor of [child chain gauge factory V2](../../tasks/20230316-child-chain-gauge-factory-v2/), which handles both BAL and non-BAL rewards. V2 gauges do not require auxiliary contracts to manage rewards efficiently.


Deployment of the Child Chain Gauge Token Adder, which is used to add reward tokens to Rewards Only Gauges, the standard child chain gauge. Unlike the L1 liquidity gauges, we need this in child chains as Rewards Only Gauges are composed of gauge and streamer, and both need to be kept in sync.

## Useful Files

- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [`ChildChainGaugeTokenAdder` artifact](./artifact/ChildChainGaugeTokenAdder.json)
