# 2025-02-14 - V3 Protocol Fee Controller (V2)

Redeployment of the Protocol Fee Controller. This version adds events on new pool registration, reporting the initial values of the aggregate swap and yield fees. Otherwise, it would be much harder to track protocol fee percentages for new pools (and actually impossible to know whether they were protocol fee exempt solely by tracking events).

There is nothing to deprecate, as the original Protocol Fee Controller was deployed as part of the Vault package. The fee controller is upgradeable in the Vault via a permissioned function.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/37c26dc46cc466fecf29b4650408db93f060b778)
- [`ProtocolFeeController` artifact](./artifact/ProtocolFeeController.json)
