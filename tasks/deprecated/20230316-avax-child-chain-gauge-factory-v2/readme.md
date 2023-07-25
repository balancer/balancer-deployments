# 2023-03-16 - Child Chain Gauge Factory

> ⚠️ **DEPRECATED: do not use** ⚠️
> This deployment has been deprecated in Avalanche because the BAL token address changed, and this contract requires it to work.
> See previous BAL address [here](../00000000-avax-tokens/output/avalanche.json) and current address [here](../../00000000-tokens/output/avalanche.json).
> The contract has been redeployed with the same build-info and the new configuration in the [original task](../../20230316-child-chain-gauge-factory-v2).

Deployment of the `ChildChainGaugeFactory` V2, for liquidity gauges to be used with pools on networks other than Ethereum.
This version simplifies the system to distribute BAL and allows veBAL boosts on L2s and sidechains other than Mainnet.

## Useful Files

- [Avalanche mainnet addresses](./output/avalanche.json)
- [`ChildChainGauge` artifact](./artifact/ChildChainGauge.json)
- [`ChildChainGaugeFactory` artifact](./artifact/ChildChainGaugeFactory.json)
