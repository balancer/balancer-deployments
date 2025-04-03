# 2025-02-14 - V3 Protocol Fee Controller (V2)

Redeployment of the Protocol Fee Controller. This version adds events on new pool registration, reporting the initial values of the aggregate swap and yield fees. Otherwise, it would be much harder to track protocol fee percentages for new pools (and actually impossible to know whether they were protocol fee exempt solely by tracking events).

There is nothing to deprecate, as the original Protocol Fee Controller was deployed as part of the Vault package. The fee controller is upgradeable in the Vault via a permissioned function.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/77290600e9c896707c26d2a353ecfe82d97fa5b9)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ProtocolFeeController` artifact](./artifact/ProtocolFeeController.json)
