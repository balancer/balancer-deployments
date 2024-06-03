# 2024-05-22 - Fraxtal Root Gauge Factory

Deployment of the `OptimisticRootGaugeFactory`, for stakeless gauges that bridge funds to their Fraxtal counterparts.
The code that manages the bridge is the same as in [`OptimismRootGaugeFactory` V2](../20220823-optimism-root-gauge-factory-v2/), but this deployment points to the [Fraxtal OP Stack Bridge](https://docs.frax.com/fraxtal/tools/bridges#fraxtal-op-stack-bridge).

It also has a `NETWORK` getter set in the factory, which helps to identify the target network.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [`OptimisticRootGauge` artifact](./artifact/OptimisticRootGauge.json)
- [`OptimisticRootGaugeFactory` artifact](./artifact/OptimisticRootGaugeFactory.json)
