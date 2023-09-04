# 2023-08-11 - Avalanche Root Gauge Factory V2

Deployment of the `AvalancheRootGaugeFactory`, for stakeless gauges that bridge funds to their Avalanche counterparts.
This version uses a Layer Zero Omni Fungible Token as the BAL bridge, which is currently used in the Avalanche network.
Replaces [Avalanche root gauge V1](../deprecated/20230529-avalanche-root-gauge-factory/) which used anySwap wrappers to bridge BAL.

## Useful Files

- [Ethereum mainnet addresses](./output/mainnet.json)
- [`AvalancheRootGaugeFactory` artifact](./artifact/AvalancheRootGaugeFactory.json)
